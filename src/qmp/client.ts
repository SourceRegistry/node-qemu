import { createConnection, type Socket } from "node:net";
import { QMPCommands } from "./commands.js";
import type { QMPClientOptions, QMPEventEmitterMap } from "./events.js";
import { QmpCommandError, QmpError } from "./errors.js";

interface QmpGreeting {
  QMP: { version: unknown; capabilities: string[] };
}

interface QmpResponseMsg {
  id?: string;
  return?: unknown;
  error?: { class: string; desc: string };
}

interface QmpEventMsg {
  event: string;
  data?: unknown;
  timestamp: { seconds: number; microseconds: number };
}

interface CommandEntry {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

interface QueuedCommand {
  cmd: string;
  args?: Record<string, unknown>;
  entry: CommandEntry;
}

/**
 * QMP client for a single QEMU instance.
 *
 * Connects to a Unix socket or TCP endpoint, negotiates `qmp_capabilities`,
 * then dispatches typed commands and emits typed async events.
 *
 * Pass `{ oob: true }` in options to enable Out-of-Band command support, then
 * use {@link executeOob} to send commands that bypass the serial queue.
 *
 * @example
 * ```ts
 * await using client = new QMPClient({ socketPath: "/run/qemu/vm1.sock" });
 * await client.connect();
 * const status = await client.queryStatus();
 * ```
 */
export class QMPClient extends QMPCommands {
  private socket: Socket | null = null;
  private buf = "";
  private queue: QueuedCommand[] = [];
  private inflight: CommandEntry | null = null;
  private ready = false;
  private closed = false;

  private handshakeResolve: (() => void) | null = null;
  private handshakeReject: ((e: Error) => void) | null = null;
  private awaitingCapReply = false;

  private reconnectAttempt = 0;
  private readonly reconnectDelay: number;
  private readonly reconnectMaxDelay: number;

  /** Tracks in-flight OOB commands by their correlation ID. */
  private readonly pendingOob = new Map<string, CommandEntry>();
  private oobSeq = 0;

  constructor(private readonly opts: QMPClientOptions) {
    super();
    this.reconnectDelay = opts.reconnectDelay ?? 1000;
    this.reconnectMaxDelay = opts.reconnectMaxDelay ?? 30_000;
  }

  async connect(): Promise<void> {
    if (this.closed) throw new QmpError("Client is closed", "CLIENT_CLOSED");
    if (this.socket) throw new QmpError("Already connected", "ALREADY_CONNECTED");

    return new Promise<void>((resolve, reject) => {
      this.handshakeResolve = resolve;
      this.handshakeReject = reject;
      this.createSocket();
    });
  }

  private createSocket(): void {
    const sock =
      this.opts.socketPath != null
        ? createConnection(this.opts.socketPath)
        : createConnection({
            host: this.opts.host ?? "127.0.0.1",
            port: this.opts.port ?? 4444,
          });

    this.socket = sock;
    sock.setEncoding("utf8");

    sock.on("data", (chunk: string) => this.onData(chunk));

    sock.on("error", (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      if (this.handshakeReject) {
        const reject = this.handshakeReject;
        this.handshakeResolve = null;
        this.handshakeReject = null;
        reject(err);
      } else if (code === "ECONNRESET" || code === "EPIPE") {
        // Socket closed by the remote end — the close event fires next and
        // handles all cleanup; no need to surface this as an error.
      } else {
        this.emit("error", err as Error);
      }
    });

    sock.on("close", () => {
      this.ready = false;

      if (this.inflight) {
        this.inflight.reject(new QmpError("Connection closed", "CONNECTION_CLOSED"));
        this.inflight = null;
      }
      for (const { entry } of this.queue) {
        entry.reject(new QmpError("Connection closed", "CONNECTION_CLOSED"));
      }
      this.queue = [];

      for (const entry of this.pendingOob.values()) {
        entry.reject(new QmpError("Connection closed", "CONNECTION_CLOSED"));
      }
      this.pendingOob.clear();

      if (!this.closed) {
        this.emit("disconnected");
        this.scheduleReconnect();
      }

      this.socket = null;
      this.buf = "";
      this.awaitingCapReply = false;
    });
  }

  private onData(chunk: string): void {
    this.buf += chunk;
    let idx: number;
    while ((idx = this.buf.indexOf("\n")) !== -1) {
      const line = this.buf.slice(0, idx).trim();
      this.buf = this.buf.slice(idx + 1);
      if (!line) continue;
      let msg: unknown;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      this.dispatch(msg as Record<string, unknown>);
    }
  }

  private dispatch(msg: Record<string, unknown>): void {
    if ("QMP" in msg) {
      const capArgs = this.opts.oob
        ? { arguments: { enable: ["oob"] } }
        : {};
      this.awaitingCapReply = true;
      this.socket!.write(
        JSON.stringify({ execute: "qmp_capabilities", ...capArgs }) + "\r\n",
      );
      return;
    }

    if ("event" in msg) {
      const e = msg as unknown as QmpEventMsg;
      this.emit(e.event as keyof QMPEventEmitterMap, (e.data ?? {}) as never);
      this.emit("rawEvent", {
        event: e.event,
        data: e.data ?? {},
        timestamp: e.timestamp,
      });
      return;
    }

    if ("return" in msg || "error" in msg) {
      const r = msg as unknown as QmpResponseMsg;

      // OOB response — matched by correlation ID
      if (r.id !== undefined && this.pendingOob.has(r.id)) {
        const entry = this.pendingOob.get(r.id)!;
        this.pendingOob.delete(r.id);
        if (r.error) {
          entry.reject(new QmpCommandError(r.error.class, r.error.desc));
        } else {
          entry.resolve(r.return);
        }
        return;
      }

      if (this.awaitingCapReply) {
        this.awaitingCapReply = false;
        this.ready = true;
        this.reconnectAttempt = 0;

        const resolve = this.handshakeResolve;
        this.handshakeResolve = null;
        this.handshakeReject = null;

        this.emit("connected");
        resolve?.();
        this.flush();
        return;
      }

      const entry = this.inflight;
      this.inflight = null;

      if (!entry) return;

      if (r.error) {
        entry.reject(new QmpCommandError(r.error.class, r.error.desc));
      } else {
        entry.resolve(r.return);
      }

      this.flush();
    }
  }

  private flush(): void {
    if (this.inflight || !this.ready || this.queue.length === 0 || !this.socket) return;
    const next = this.queue.shift()!;
    this.inflight = next.entry;
    const frame: Record<string, unknown> = { execute: next.cmd };
    if (next.args !== undefined) frame.arguments = next.args;
    this.socket.write(JSON.stringify(frame) + "\r\n");
  }

  execute<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (this.closed) return Promise.reject(new QmpError("Client is closed", "CLIENT_CLOSED"));
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        cmd: command,
        args,
        entry: {
          resolve: resolve as (v: unknown) => void,
          reject,
        },
      });
      this.flush();
    });
  }

  /**
   * Send a command Out-of-Band — bypasses the serial queue and is dispatched
   * immediately even if another command is in-flight.
   *
   * Requires `{ oob: true }` in the constructor options so that OOB support
   * is negotiated during the QMP handshake. Only commands that QEMU marks as
   * OOB-capable will succeed; others will be rejected by QEMU.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#oob}
   */
  executeOob<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (this.closed) return Promise.reject(new QmpError("Client is closed", "CLIENT_CLOSED"));
    if (!this.ready) return Promise.reject(new QmpError("Not connected", "NOT_CONNECTED"));
    return new Promise<T>((resolve, reject) => {
      const id = `oob-${++this.oobSeq}`;
      this.pendingOob.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      const frame: Record<string, unknown> = {
        execute: command,
        id,
        control: { "run-oob": true },
      };
      if (args !== undefined) frame.arguments = args;
      this.socket!.write(JSON.stringify(frame) + "\r\n");
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    this.ready = false;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }

  private scheduleReconnect(): void {
    if (!this.opts.reconnect || this.closed) return;
    const delay = Math.min(
      this.reconnectDelay * 2 ** this.reconnectAttempt,
      this.reconnectMaxDelay,
    );
    this.reconnectAttempt++;
    setTimeout(() => {
      if (this.closed) return;
      this.createSocket();
    }, delay);
  }
}
