/** QMP event payload types and the full event map. */

import type { QmpTimestamp } from "./types.js";

// ── Options ───────────────────────────────────────────────────────────────────

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

// ── Event payloads ────────────────────────────────────────────────────────────

export type ShutdownReason =
  | "host-qmp-quit"
  | "host-qmp-system-reset"
  | "corrupt-guest-memory"
  | "daemon-tidy"
  | "host-signal"
  | "host-ui"
  | "guest-shutdown"
  | "guest-reset"
  | "guest-panic"
  | "subsystem-reset"
  | "snapshot-load";

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
  flags?: { action_required: boolean; recursive: boolean };
}

export interface NetdevStreamEvent {
  netdev_id: string;
  addr?: Record<string, unknown>;
}

export interface FailoverNegotiatedEvent {
  "device-id": string;
}

export interface BlockExportDeletedEvent {
  id: string;
}

export interface BalloonChangeEvent {
  actual: number;
}

export interface MemoryDeviceSizeChangeEvent {
  id?: string;
  size: number;
  "qom-path": string;
}

export interface HvBalloonStatusReportEvent {
  committed: number;
  "can-report": boolean;
}

export interface DeviceUnplugGuestErrorEvent {
  device?: string;
  path: string;
}

// ── Raw event ─────────────────────────────────────────────────────────────────

/** Payload of the synthetic `rawEvent` meta-event, fired for every QMP event. */
export interface RawQmpEvent {
  /** QMP event name, e.g. `"SHUTDOWN"`. */
  event: string;
  /** Event data payload (may be empty object). */
  data: unknown;
  /** Server-side timestamp attached to every QMP event. */
  timestamp: QmpTimestamp;
}

// ── Dump completed ────────────────────────────────────────────────────────────

export interface DumpCompletedEvent {
  result: {
    total: number;
    completed: number;
    filename: string;
    format: string;
  };
  error?: string;
}

// ── Event map ─────────────────────────────────────────────────────────────────

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
  /** @since QEMU 7.2 — a stream-based netdev backend connected. */
  NETDEV_STREAM_CONNECTED: NetdevStreamEvent;
  /** @since QEMU 7.2 — a stream-based netdev backend disconnected. */
  NETDEV_STREAM_DISCONNECTED: NetdevStreamEvent;
  /** @since QEMU 10.0 — a vhost-user netdev backend connected. */
  NETDEV_VHOST_USER_CONNECTED: NetdevStreamEvent;
  /** @since QEMU 10.0 — a vhost-user netdev backend disconnected. */
  NETDEV_VHOST_USER_DISCONNECTED: NetdevStreamEvent;
  /** @since QEMU 4.2 — failover primary device negotiation completed. */
  FAILOVER_NEGOTIATED: FailoverNegotiatedEvent;
  /** @since QEMU 5.2 — a block export was torn down. */
  BLOCK_EXPORT_DELETED: BlockExportDeletedEvent;
  /** @since QEMU 1.2 — the balloon target size changed. */
  BALLOON_CHANGE: BalloonChangeEvent;
  /** @since QEMU 5.1 — a memory device's size changed at runtime. */
  MEMORY_DEVICE_SIZE_CHANGE: MemoryDeviceSizeChangeEvent;
  /** @since QEMU 8.2 — Hyper-V dynamic memory (hv-balloon) status report. */
  HV_BALLOON_STATUS_REPORT: HvBalloonStatusReportEvent;
  /**
   * @since QEMU 9.1 — guest failed to unplug a device on request.
   * Replaces the removed `MEM_UNPLUG_ERROR` event.
   */
  DEVICE_UNPLUG_GUEST_ERROR: DeviceUnplugGuestErrorEvent;
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
