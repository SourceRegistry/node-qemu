/** QMP wire types — RunState, migration, block, CPU, memory, VNC, etc. */

// ── Run state ─────────────────────────────────────────────────────────────────

export type RunState =
  | "debug"
  | "finish-migrate"
  | "guest-panicked"
  | "inmigrate"
  | "internal-error"
  | "io-error"
  | "paused"
  | "postmigrate"
  | "prelaunch"
  | "restore-vm"
  | "running"
  | "save-vm"
  | "shutdown"
  | "suspended"
  | "watchdog"
  | "colo";

export interface StatusInfo {
  running: boolean;
  singlestep: boolean;
  status: RunState;
}

// ── Version ───────────────────────────────────────────────────────────────────

export interface VersionTriple {
  major: number;
  minor: number;
  micro: number;
}

export interface VersionInfo {
  qemu: VersionTriple;
  package: string;
}

export interface CommandInfo {
  name: string;
}

export type SchemaMetaType =
  | "builtin"
  | "enum"
  | "array"
  | "object"
  | "alternate"
  | "command"
  | "event";

export interface SchemaInfo {
  name: string;
  "meta-type": SchemaMetaType;
  [key: string]: unknown;
}

// ── Block ─────────────────────────────────────────────────────────────────────

export type BlockDeviceIoStatus = "ok" | "failed" | "nospace";

export interface BlockDeviceCacheInfo {
  writeback: boolean;
  direct: boolean;
  "no-flush": boolean;
}

export interface BlockDirtyInfo {
  name?: string;
  count: number;
  granularity: number;
  recording: boolean;
  busy: boolean;
  persistent: boolean;
  inconsistent?: boolean;
}

export interface SnapshotInfoQmp {
  id: string;
  name: string;
  "vm-state-size": number;
  "date-sec": number;
  "date-nsec": number;
  "vm-clock-sec": number;
  "vm-clock-nsec": number;
}

export interface ImageInfoQmp {
  filename: string;
  format: string;
  "virtual-size": number;
  "actual-size"?: number;
  "cluster-size"?: number;
  dirty?: boolean;
  "backing-filename"?: string;
  "full-backing-filename"?: string;
  "backing-filename-format"?: string;
  snapshots?: SnapshotInfoQmp[];
}

export interface BlockDeviceInfo {
  node_name: string;
  file: string;
  ro: boolean;
  drv: string;
  encrypted: boolean;
  encryption_key_missing: boolean;
  detect_zeroes: "off" | "on" | "unmap";
  bps: number;
  bps_rd: number;
  bps_wr: number;
  iops: number;
  iops_rd: number;
  iops_wr: number;
  image: ImageInfoQmp;
  backing_file?: string;
  backing_file_depth?: number;
  bps_max?: number;
  bps_rd_max?: number;
  bps_wr_max?: number;
  iops_max?: number;
  iops_rd_max?: number;
  iops_wr_max?: number;
  iops_size?: number;
  group?: string;
  cache: BlockDeviceCacheInfo;
  write_threshold: number;
  dirty_bitmaps?: BlockDirtyInfo[];
}

export interface BlockInfo {
  device: string;
  type: string;
  removable: boolean;
  locked: boolean;
  inserted?: BlockDeviceInfo;
  "tray-open"?: boolean;
  "io-status"?: BlockDeviceIoStatus;
  dirty_bitmaps?: BlockDirtyInfo[];
}

export interface BlockLatencyHistogramInfo {
  boundaries: number[];
  bins: number[];
}

export interface BlockDeviceTimedStats {
  interval_length: number;
  min_rd_latency_ns: number;
  max_rd_latency_ns: number;
  avg_rd_latency_ns: number;
  min_wr_latency_ns: number;
  max_wr_latency_ns: number;
  avg_wr_latency_ns: number;
  min_flush_latency_ns: number;
  max_flush_latency_ns: number;
  avg_flush_latency_ns: number;
  avg_rd_queue_depth: number;
  avg_wr_queue_depth: number;
}

export interface BlockDeviceStats {
  rd_bytes: number;
  wr_bytes: number;
  rd_operations: number;
  wr_operations: number;
  flush_operations: number;
  flush_total_time_ns: number;
  wr_total_time_ns: number;
  rd_total_time_ns: number;
  wr_highest_offset: number;
  rd_merged: number;
  wr_merged: number;
  idle_time_ns?: number;
  failed_rd_operations: number;
  failed_wr_operations: number;
  failed_flush_operations: number;
  invalid_rd_operations: number;
  invalid_wr_operations: number;
  invalid_flush_operations: number;
  account_invalid: boolean;
  account_failed: boolean;
  timed_stats: BlockDeviceTimedStats[];
  wr_latency_histogram?: BlockLatencyHistogramInfo;
  rd_latency_histogram?: BlockLatencyHistogramInfo;
  flush_latency_histogram?: BlockLatencyHistogramInfo;
}

export interface BlockStats {
  device?: string;
  node_name?: string;
  stats: BlockDeviceStats;
  parent?: BlockStats;
  backing?: BlockStats;
}

export type BlockJobType = "commit" | "stream" | "mirror" | "backup";

export type BlockJobStatus =
  | "created"
  | "running"
  | "paused"
  | "ready"
  | "standby"
  | "waiting"
  | "pending"
  | "aborting"
  | "concluded"
  | "null";

export interface BlockJobInfo {
  type: BlockJobType;
  device: string;
  len: number;
  offset: number;
  busy: boolean;
  paused: boolean;
  speed: number;
  "io-status": BlockDeviceIoStatus;
  ready: boolean;
  status: BlockJobStatus;
  "auto-finalize": boolean;
  "auto-dismiss": boolean;
  error?: string;
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export type JobType =
  | "commit"
  | "stream"
  | "mirror"
  | "backup"
  | "create"
  | "amend"
  | "snapshot-load"
  | "snapshot-save"
  | "snapshot-delete";

export interface JobInfo {
  id: string;
  type: JobType;
  status: BlockJobStatus;
  "current-progress": number;
  "total-progress": number;
  error?: string;
}

// ── CPU / memory ──────────────────────────────────────────────────────────────

export interface CpuInfoFast {
  "cpu-index": number;
  "qom-path": string;
  "thread-id": number;
  target: string;
  arch?: string;
}

export interface MemorySizeInfo {
  "base-memory": number;
  "plugged-memory"?: number;
}

export interface Memdev {
  id?: string;
  size: number;
  merge: boolean;
  dump: boolean;
  prealloc: boolean;
  share: boolean;
  reserve?: boolean;
  "host-nodes": number[];
  policy: "default" | "preferred" | "bind" | "interleave";
}

/** @deprecated since QEMU 11.0 — use {@link AcceleratorInfo} via `query-accelerators`. */
export interface KvmInfo {
  enabled: boolean;
  present: boolean;
}

/** Accelerator backend, e.g. `kvm`, `tcg`, `hvf`, `whpx`, `xen`. */
export type Accelerator = "hvf" | "kvm" | "mshv" | "nvmm" | "qtest" | "tcg" | "whpx" | "xen";

/** @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-accelerators} */
export interface AcceleratorInfo {
  enabled: Accelerator;
  present: Accelerator[];
}

export interface HotpluggableCPU {
  type: string;
  "vcpus-count": number;
  props: Record<string, unknown>;
  "qom-path"?: string;
}

export interface MemoryDeviceInfo {
  type: string;
  data: Record<string, unknown>;
}

// ── VNC / display ─────────────────────────────────────────────────────────────

export interface VncClientInfo {
  host: string;
  family: string;
  service: string;
  sasl_username?: string;
  x509_dname?: string;
}

export interface VncInfo {
  enabled: boolean;
  auth: string;
  host?: string;
  family?: "ipv4" | "ipv6" | "unix" | "vsock" | "unknown";
  service?: string;
  clients?: VncClientInfo[];
}

/** One entry of `query-vnc-servers` — same shape as {@link VncInfo} plus a display `id`. */
export interface VncServerInfo extends VncInfo {
  id: string;
}

export interface ChardevInfo {
  label: string;
  filename: string;
  "frontend-open": boolean;
}

// ── Migration ─────────────────────────────────────────────────────────────────

export type MigrationStatus =
  | "none"
  | "setup"
  | "cancelling"
  | "cancelled"
  | "active"
  | "postcopy-active"
  | "postcopy-paused"
  | "postcopy-recover"
  | "completed"
  | "failed"
  | "colo"
  | "pre-switchover"
  | "device"
  | "wait-unplug";

export interface MigrationStats {
  transferred: number;
  remaining: number;
  total: number;
  duplicate: number;
  normal: number;
  normal_bytes: number;
  dirty_pages_rate: number;
  mbps: number;
  dirty_sync_count: number;
  postcopy_requests: number;
  page_size: number;
  multifd_bytes: number;
  pages_per_second: number;
}

export interface XBZRLECacheStats {
  cache_size: number;
  bytes: number;
  pages: number;
  cache_miss: number;
  cache_miss_rate: number;
  encoding_rate: number;
  overflow: number;
}

export interface MigrationInfo {
  status?: MigrationStatus;
  ram?: MigrationStats;
  disk?: MigrationStats;
  "xbzrle-cache"?: XBZRLECacheStats;
  "total-time"?: number;
  "expected-downtime"?: number;
  downtime?: number;
  "setup-time"?: number;
  "cpu-throttle-percentage"?: number;
  error?: string;
  "error-desc"?: string;
  postcopy_blocktime?: number;
  postcopy_vcpu_blocktime?: number[];
}

export type MigrationCapability =
  | "xbzrle"
  | "rdma-pin-all"
  | "auto-converge"
  | "events"
  | "postcopy-ram"
  | "x-colo"
  | "release-ram"
  | "return-path"
  | "pause-before-switchover"
  | "multifd"
  | "dirty-bitmaps"
  | "postcopy-blocktime"
  | "late-block-activate"
  | "x-ignore-shared"
  | "validate-uuid"
  | "background-snapshot"
  | "zero-copy-send"
  | "postcopy-preempt"
  | "switchover-ack"
  /** @since QEMU 8.2 */
  | "dirty-limit"
  /** @since QEMU 9.0 */
  | "mapped-ram";

export interface MigrationCapabilityStatus {
  capability: MigrationCapability;
  state: boolean;
}

/**
 * Names accepted by `migrate-set-parameters` / returned by `query-migrate-parameters`.
 * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-set-parameters}
 */
export type MigrationParameter =
  | "announce-initial"
  | "announce-max"
  | "announce-rounds"
  | "announce-step"
  | "throttle-trigger-threshold"
  | "cpu-throttle-initial"
  | "cpu-throttle-increment"
  | "cpu-throttle-tailslow"
  | "tls-creds"
  | "tls-hostname"
  | "tls-authz"
  | "max-bandwidth"
  | "avail-switchover-bandwidth"
  | "downtime-limit"
  | "multifd-channels"
  | "xbzrle-cache-size"
  | "max-postcopy-bandwidth"
  | "max-cpu-throttle"
  | "multifd-compression"
  | "multifd-zlib-level"
  | "multifd-zstd-level"
  /** @since QEMU 9.2 */
  | "multifd-qatzip-level"
  | "block-bitmap-mapping"
  | "vcpu-dirty-limit"
  /** @since QEMU 8.2/10.2 — `cpr-reboot` | `cpr-transfer` | `cpr-exec` | `normal` */
  | "mode"
  /** @since QEMU 9.0 */
  | "zero-page-detection"
  /** @since QEMU 9.1 */
  | "direct-io"
  /** @since QEMU 10.2 */
  | "cpr-exec-command";

export type MigrationChannelType = "main" | "multifd" | "postcopy";

/** Transport address for a migration channel — shape mirrors QEMU's `SocketAddress`/`MigrationAddress` union. */
export interface MigrationAddress {
  transport: "socket" | "exec" | "rdma" | "file";
  [key: string]: unknown;
}

export interface MigrationChannel {
  "channel-type": MigrationChannelType;
  addr: MigrationAddress;
}

// ── Command argument types ────────────────────────────────────────────────────

export type RebootAction = "reset" | "shutdown";
export type ShutdownAction = "poweroff" | "pause";
export type PanicAction = "pause" | "poweroff" | "exit-failure" | "none";
export type WatchdogAction =
  | "reset"
  | "shutdown"
  | "poweroff"
  | "pause"
  | "debug"
  | "none"
  | "inject-nmi";

export interface SetActionOptions {
  reboot?: RebootAction;
  shutdown?: ShutdownAction;
  panic?: PanicAction;
  watchdog?: WatchdogAction;
}

export interface TransactionAction {
  type: string;
  data: Record<string, unknown>;
}

export interface SnapshotSaveOptions {
  "job-id": string;
  tag: string;
  vmstate: string;
  devices: string[];
}

export interface SnapshotLoadOptions {
  "job-id": string;
  tag: string;
  vmstate: string;
  devices: string[];
}

export interface SnapshotDeleteOptions {
  "job-id": string;
  tag: string;
  devices: string[];
}

export interface BlockDirtyBitmapAdd {
  node: string;
  name: string;
  granularity?: number;
  persistent?: boolean;
  disabled?: boolean;
}

export interface BlockDirtyBitmapRemove {
  node: string;
  name: string;
}

export interface BlockDirtyBitmapClear {
  node: string;
  name: string;
}

export interface BlockDirtyBitmapEnable {
  node: string;
  name: string;
}

export interface BlockDirtyBitmapDisable {
  node: string;
  name: string;
}

export interface BlockDirtyBitmapMerge {
  node: string;
  target: string;
  bitmaps: Array<string | { node: string; name: string }>;
}

export interface BlockdevBackupOptions {
  device: string;
  target: string;
  sync: "top" | "full" | "incremental" | "none";
  "job-id"?: string;
  speed?: number;
  bitmap?: string;
  "bitmap-mode"?: "on-success" | "never" | "always";
  compress?: boolean;
  "on-source-error"?: "report" | "ignore" | "enospc" | "stop" | "auto";
  "on-target-error"?: "report" | "ignore" | "enospc" | "stop" | "auto";
  "auto-finalize"?: boolean;
  "auto-dismiss"?: boolean;
  filter_node_name?: string;
}

export interface BlockdevMirrorOptions {
  device: string;
  target: string;
  sync: "top" | "full" | "none";
  "job-id"?: string;
  speed?: number;
  granularity?: number;
  "buf-size"?: number;
  "on-source-error"?: "report" | "ignore" | "enospc" | "stop" | "auto";
  "on-target-error"?: "report" | "ignore" | "enospc" | "stop" | "auto";
  replaces?: string;
  "auto-finalize"?: boolean;
  "auto-dismiss"?: boolean;
  "copy-mode"?: "background" | "write-blocking";
}

export interface BlockStreamOptions {
  device: string;
  "job-id"?: string;
  base?: string;
  "base-node"?: string;
  "backing-file"?: string;
  speed?: number;
  "on-error"?: "report" | "ignore" | "enospc" | "stop" | "auto";
  "auto-finalize"?: boolean;
  "auto-dismiss"?: boolean;
}

export interface BlockCommitOptions {
  device: string;
  "job-id"?: string;
  base?: string;
  "base-node"?: string;
  top?: string;
  "top-node"?: string;
  "backing-file"?: string;
  speed?: number;
  "on-error"?: "report" | "ignore" | "enospc" | "stop" | "auto";
  "filter-node-name"?: string;
  "auto-finalize"?: boolean;
  "auto-dismiss"?: boolean;
}

export interface DeviceAddOptions {
  driver: string;
  bus?: string;
  id?: string;
  [key: string]: unknown;
}

export interface NetdevAddOptions {
  type: string;
  id: string;
  [key: string]: unknown;
}

export interface MigrateOptions {
  /**
   * Migration URI, e.g. `"tcp:host:port"` or `"unix:/path"`.
   * Mutually exclusive with `channels` (the modern multi-channel form).
   */
  uri?: string;
  /** Multi-channel transport (main/multifd/postcopy), replacing `uri` for TLS/multi-fd setups. */
  channels?: MigrationChannel[];
  resume?: boolean;
}

export interface MigrateRecoverOptions {
  uri: string;
}

// ── Dirty rate / dirty limit ──────────────────────────────────────────────────

export type DirtyRateStatus = "unstarted" | "measuring" | "measured";
export type DirtyRateMeasureMode = "page-sampling" | "dirty-bitmap" | "dirty-ring";

export interface DirtyRateVcpu {
  id: number;
  "dirty-rate": number;
}

export interface DirtyRateInfo {
  "dirty-rate"?: number;
  status: DirtyRateStatus;
  "start-time"?: number;
  "calc-time": number;
  "sample-pages"?: number;
  mode: DirtyRateMeasureMode;
  vcpu?: DirtyRateVcpu[];
}

export interface CalcDirtyRateOptions {
  "calc-time": number;
  "sample-pages"?: number;
  mode?: DirtyRateMeasureMode;
}

export interface DirtyLimitInfo {
  "cpu-index": number;
  "limit-rate"?: number;
  "current-rate"?: number;
}

export interface SetVcpuDirtyLimitOptions {
  "cpu-index"?: number;
  "dirty-rate": number;
}

export interface CancelVcpuDirtyLimitOptions {
  "cpu-index"?: number;
}

export interface AnnounceSelfOptions {
  initial?: number;
  max?: number;
  rounds?: number;
  step?: number;
}

export interface SetPasswordOptions {
  protocol: "vnc" | "spice";
  password: string;
  id?: string;
  connected?: "fail" | "disconnect" | "keep";
}

export interface ExpirePasswordOptions {
  protocol: "vnc" | "spice";
  time: string;
  id?: string;
}

export interface ScreendumpOptions {
  filename: string;
  device?: string;
  head?: number;
}

export interface RingbufWriteOptions {
  device: string;
  data: string;
  format?: "utf8" | "base64";
}

export interface RingbufReadOptions {
  device: string;
  size: number;
  format?: "utf8" | "base64";
}

// ── Timestamp ─────────────────────────────────────────────────────────────────

export interface QmpTimestamp {
  /** Seconds since Unix epoch. */
  seconds: number;
  /** Microseconds component (0–999999). */
  microseconds: number;
}

// ── IO threads ────────────────────────────────────────────────────────────────

export interface IoThreadInfo {
  id: string;
  "thread-id": number;
  "poll-max-ns"?: number;
  "poll-grow"?: number;
  "poll-shrink"?: number;
  "aio-max-batch"?: number;
}

// ── Chardev ───────────────────────────────────────────────────────────────────

/** Return value of `chardev-add` — populated for PTY backends. */
export interface ChardevReturn {
  pty?: string;
}

export interface ChardevAddOptions {
  id: string;
  backend: {
    /** Backend type, e.g. `"socket"`, `"pty"`, `"file"`, `"ringbuf"`. */
    type: string;
    data: Record<string, unknown>;
  };
}

export interface ChardevChangeOptions {
  id: string;
  backend: {
    type: string;
    data: Record<string, unknown>;
  };
}

// ── QOM object management ─────────────────────────────────────────────────────

export interface ObjectAddOptions {
  /** QOM type name, e.g. `"memory-backend-ram"`. */
  "qom-type": string;
  id: string;
  props?: Record<string, unknown>;
}

// ── Memory dump ───────────────────────────────────────────────────────────────

export type DumpGuestMemoryFormat =
  | "elf"
  | "kdump-zlib"
  | "kdump-lzo"
  | "kdump-snappy"
  | "kdump-raw-zlib"
  | "kdump-raw-lzo"
  | "kdump-raw-snappy"
  | "win-dmp";

export interface DumpGuestMemoryOptions {
  /** Whether to use paging (required for non-ELF formats). */
  paging: boolean;
  /** Dump destination, e.g. `"file:/tmp/dump.elf"` or `"fd:N"`. */
  protocol: string;
  /** Run in background — returns immediately, emits `DUMP_COMPLETED` event. */
  detach?: boolean;
  /** Start GFN for partial dump. */
  begin?: number;
  /** Length in bytes for partial dump. */
  length?: number;
  format?: DumpGuestMemoryFormat;
}

// ── VNC / SPICE client injection ──────────────────────────────────────────────

export interface AddClientOptions {
  protocol: "vnc" | "spice";
  /** File-descriptor name passed via SCM_RIGHTS. */
  fdname: string;
  skipauth?: boolean;
  tls?: boolean;
}

// ── Display ───────────────────────────────────────────────────────────────────

export interface DisplayOptions {
  type: string;
  [key: string]: unknown;
}
