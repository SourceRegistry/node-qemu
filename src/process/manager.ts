import { EventEmitter } from "node:events";
import { spawn, type ChildProcess } from "node:child_process";
import { writeFile, rm } from "node:fs/promises";
import { buildArgs } from "./args.js";
import type { QemuConfig, QemuProcessOptions } from "./config.js";
import { resolveQemuBinary } from "../util/resolve-binary.js";

/**
 * Manages the lifecycle of a QEMU OS process.
 *
 * Decoupled from `QMPClient` — create a client separately using the
 * socket path exposed via {@link QemuProcess.socketPath}.
 *
 * **Events emitted:**
 * - `stdout` `(data: string)` — line(s) from QEMU's stdout
 * - `stderr` `(data: string)` — line(s) from QEMU's stderr
 * - `exit` `(code: number | null, signal: string | null)` — process exited
 * - `error` `(err: Error)` — spawn error
 *
 * @example
 * ```ts
 * await using proc = new QemuProcess({ config });
 * await proc.start();
 * const client = new QMPClient({ socketPath: proc.socketPath });
 * await client.connect();
 * ```
 */
export class QemuProcess extends EventEmitter {
  readonly binary: string;
  readonly config: QemuConfig;
  private proc: ChildProcess | null = null;

  constructor(opts: QemuProcessOptions) {
    super();
    this.binary = opts.binary ?? resolveQemuBinary("qemu-system-x86_64");
    this.config = opts.config;
  }

  /** PID of the running QEMU process, or `undefined` if not started. */
  get pid(): number | undefined {
    return this.proc?.pid;
  }

  /** Unix socket path exposed for QMP, if configured. */
  get socketPath(): string | undefined {
    if (this.config.qmp && "socketPath" in this.config.qmp) {
      return this.config.qmp.socketPath;
    }
    return undefined;
  }

  /**
   * Spawn the QEMU process with the configured arguments.
   * Writes a PID file if `config.pidfile` is set.
   * Rejects if the process is already running.
   */
  async start(): Promise<void> {
    if (this.proc) throw new Error("Process already started");

    const args = buildArgs(this.config);
    const proc = spawn(this.binary, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.proc = proc;

    if (this.config.pidfile && proc.pid != null) {
      await writeFile(this.config.pidfile, String(proc.pid), "utf8");
    }

    proc.stdout?.on("data", (chunk: Buffer) =>
      this.emit("stdout", chunk.toString("utf8")),
    );
    proc.stderr?.on("data", (chunk: Buffer) =>
      this.emit("stderr", chunk.toString("utf8")),
    );

    proc.on("exit", (code, signal) => {
      this.proc = null;
      if (this.config.pidfile) {
        rm(this.config.pidfile, { force: true }).catch(() => {});
      }
      this.emit("exit", code, signal);
    });

    proc.on("error", (err) => this.emit("error", err));
  }

  /**
   * Send SIGTERM and wait for the process to exit.
   * If the process does not exit within `timeoutMs`, sends SIGKILL.
   *
   * @param timeoutMs - Milliseconds to wait before escalating to SIGKILL. Default: `5000`.
   */
  async stop(timeoutMs = 5_000): Promise<void> {
    if (!this.proc) return;
    return new Promise<void>((resolve) => {
      const proc = this.proc!;
      const timer = setTimeout(() => proc.kill("SIGKILL"), timeoutMs);
      proc.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      proc.kill("SIGTERM");
    });
  }

  /** Send SIGKILL immediately and wait for the process to exit. */
  async kill(): Promise<void> {
    if (!this.proc) return;
    return new Promise<void>((resolve) => {
      this.proc!.once("exit", resolve);
      this.proc!.kill("SIGKILL");
    });
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stop();
  }
}
