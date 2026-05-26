import { QmpTimestamp } from './types.js';
export interface QMPClientOptions {
    /** Path to QEMU's QMP Unix socket. Mutually exclusive with host/port. */
    socketPath?: string;
    /** TCP host for QMP. Defaults to 127.0.0.1. */
    host?: string;
    /** TCP port for QMP. Defaults to 4444. */
    port?: number;
    /** Automatically reconnect on unexpected disconnect. */
    reconnect?: boolean;
    /** Initial reconnect delay in ms. Doubles on each attempt. Default: 1000. */
    reconnectDelay?: number;
    /** Maximum reconnect delay in ms. Default: 30000. */
    reconnectMaxDelay?: number;
    /**
     * Negotiate Out-of-Band (OOB) command support during the QMP handshake.
     * When enabled, {@link QMPClient.executeOob} can dispatch commands while
     * another command is already in-flight.
     */
    oob?: boolean;
}
export type ShutdownReason = "host-qmp-quit" | "host-qmp-system-reset" | "corrupt-guest-memory" | "daemon-tidy" | "host-signal" | "host-ui" | "guest-shutdown" | "guest-reset" | "guest-panic" | "subsystem-reset" | "snapshot-load";
export interface ShutdownEvent {
    guest: boolean;
    reason: ShutdownReason;
}
export interface ResetEvent {
    guest: boolean;
    reason: ShutdownReason;
}
export interface GuestPanicInfo {
    type: string;
    [key: string]: unknown;
}
export interface GuestPanicEvent {
    action: "pause" | "poweroff" | "exit-failure";
    info?: GuestPanicInfo;
}
export interface WatchdogEvent {
    action: "reset" | "shutdown" | "poweroff" | "pause" | "debug" | "none" | "inject-nmi";
}
export interface BlockIoErrorEvent {
    device: string;
    "node-name"?: string;
    operation: "read" | "write" | "flush";
    action: "ignore" | "report" | "stop" | "enospc";
    nospace?: boolean;
    reason: string;
}
export interface BlockJobEvent {
    device: string;
    type: string;
    speed: number;
    offset: number;
    len: number;
    error?: string;
}
export interface BlockJobErrorEvent {
    device: string;
    operation: "read" | "write" | "flush";
    action: "ignore" | "report" | "stop" | "enospc";
}
export interface JobStatusChangeEvent {
    id: string;
    status: string;
}
export interface DeviceEvent {
    device?: string;
    path: string;
}
export interface MigrationEvent {
    status: string;
}
export interface MigrationPassEvent {
    pass: number;
}
export interface NicRxFilterEvent {
    name: string;
    path: string;
}
export interface VncEvent {
    server: Record<string, unknown>;
    client: Record<string, unknown>;
}
export interface MemoryFailureEvent {
    recipient: "hypervisor" | "guest";
    action: "ignore" | "inject" | "fatal" | "reset";
    flags?: {
        action_required: boolean;
        recursive: boolean;
    };
}
/** Payload of the synthetic `rawEvent` meta-event, fired for every QMP event. */
export interface RawQmpEvent {
    /** QMP event name, e.g. `"SHUTDOWN"`. */
    event: string;
    /** Event data payload (may be empty object). */
    data: unknown;
    /** Server-side timestamp attached to every QMP event. */
    timestamp: QmpTimestamp;
}
export interface DumpCompletedEvent {
    result: {
        total: number;
        completed: number;
        filename: string;
        format: string;
    };
    error?: string;
}
export type QMPEventMap = {
    SHUTDOWN: ShutdownEvent;
    POWERDOWN: Record<string, never>;
    RESET: ResetEvent;
    STOP: Record<string, never>;
    RESUME: Record<string, never>;
    GUEST_PANICKED: GuestPanicEvent;
    WATCHDOG: WatchdogEvent;
    BLOCK_IO_ERROR: BlockIoErrorEvent;
    BLOCK_JOB_COMPLETED: BlockJobEvent;
    BLOCK_JOB_CANCELLED: BlockJobEvent;
    BLOCK_JOB_ERROR: BlockJobErrorEvent;
    BLOCK_JOB_READY: BlockJobEvent;
    JOB_STATUS_CHANGE: JobStatusChangeEvent;
    DEVICE_ADDED: DeviceEvent;
    DEVICE_DELETED: DeviceEvent;
    MIGRATION: MigrationEvent;
    MIGRATION_PASS: MigrationPassEvent;
    NIC_RX_FILTER_CHANGED: NicRxFilterEvent;
    VNC_CONNECTED: VncEvent;
    VNC_INITIALIZED: VncEvent;
    VNC_DISCONNECTED: VncEvent;
    SUSPEND: Record<string, never>;
    WAKEUP: Record<string, never>;
    MEMORY_FAILURE: MemoryFailureEvent;
    DUMP_COMPLETED: DumpCompletedEvent;
    /** Fired for every QMP event with the full raw payload including timestamp. */
    rawEvent: RawQmpEvent;
    connected: void;
    disconnected: void;
    error: Error;
};
/**
 * `QMPEventMap` converted to the `EventEmitter<T>` tuple format.
 * `void` entries become `[]` (no-arg listeners); everything else becomes `[PayloadType]`.
 */
export type QMPEventEmitterMap = {
    [K in keyof QMPEventMap]: QMPEventMap[K] extends void ? [] : [QMPEventMap[K]];
};
//# sourceMappingURL=events.d.ts.map