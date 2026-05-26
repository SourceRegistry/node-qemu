import { EventEmitter } from 'node:events';
import { QemuConfig, QemuProcessOptions } from './config.js';
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
export declare class QemuProcess extends EventEmitter {
    readonly binary: string;
    readonly config: QemuConfig;
    private proc;
    constructor(opts: QemuProcessOptions);
    /** PID of the running QEMU process, or `undefined` if not started. */
    get pid(): number | undefined;
    /** Unix socket path exposed for QMP, if configured. */
    get socketPath(): string | undefined;
    /**
     * Spawn the QEMU process with the configured arguments.
     * Writes a PID file if `config.pidfile` is set.
     * Rejects if the process is already running.
     */
    start(): Promise<void>;
    /**
     * Send SIGTERM and wait for the process to exit.
     * If the process does not exit within `timeoutMs`, sends SIGKILL.
     *
     * @param timeoutMs - Milliseconds to wait before escalating to SIGKILL. Default: `5000`.
     */
    stop(timeoutMs?: number): Promise<void>;
    /** Send SIGKILL immediately and wait for the process to exit. */
    kill(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
}
//# sourceMappingURL=manager.d.ts.map