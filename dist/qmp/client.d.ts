import { QMPCommands } from './commands.js';
import { QMPClientOptions } from './events.js';
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
export declare class QMPClient extends QMPCommands {
    private readonly opts;
    private socket;
    private buf;
    private queue;
    private inflight;
    private ready;
    private closed;
    private handshakeResolve;
    private handshakeReject;
    private awaitingCapReply;
    private reconnectAttempt;
    private readonly reconnectDelay;
    private readonly reconnectMaxDelay;
    /** Tracks in-flight OOB commands by their correlation ID. */
    private readonly pendingOob;
    private oobSeq;
    constructor(opts: QMPClientOptions);
    connect(): Promise<void>;
    private createSocket;
    private onData;
    private dispatch;
    private flush;
    execute<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>;
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
    executeOob<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>;
    close(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    private scheduleReconnect;
}
//# sourceMappingURL=client.d.ts.map