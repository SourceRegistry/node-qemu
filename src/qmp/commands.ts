import { EventEmitter } from "node:events";
import type { QMPEventEmitterMap } from "./events.js";
import type {
  StatusInfo,
  VersionInfo,
  CommandInfo,
  SchemaInfo,
  BlockInfo,
  BlockStats,
  BlockJobInfo,
  BlockDeviceInfo,
  JobInfo,
  CpuInfoFast,
  MemorySizeInfo,
  Memdev,
  KvmInfo,
  VncInfo,
  ChardevInfo,
  MigrationInfo,
  MigrationCapabilityStatus,
  HotpluggableCPU,
  MemoryDeviceInfo,
  SetActionOptions,
  TransactionAction,
  SnapshotSaveOptions,
  SnapshotLoadOptions,
  SnapshotDeleteOptions,
  BlockDirtyBitmapAdd,
  BlockDirtyBitmapRemove,
  BlockDirtyBitmapClear,
  BlockDirtyBitmapEnable,
  BlockDirtyBitmapDisable,
  BlockDirtyBitmapMerge,
  BlockdevBackupOptions,
  BlockdevMirrorOptions,
  BlockStreamOptions,
  BlockCommitOptions,
  DeviceAddOptions,
  NetdevAddOptions,
  MigrateOptions,
  MigrationCapability,
  SetPasswordOptions,
  ExpirePasswordOptions,
  ScreendumpOptions,
  RingbufWriteOptions,
  RingbufReadOptions,
  IoThreadInfo,
  ChardevReturn,
  ChardevAddOptions,
  ChardevChangeOptions,
  ObjectAddOptions,
  DumpGuestMemoryOptions,
  AddClientOptions,
  DisplayOptions,
} from "./types.js";

/**
 * Abstract base providing typed QMP command methods over {@link execute}.
 * Inherits typed `.on()`, `.once()`, `.off()`, and `.emit()` from `EventEmitter<QMPEventEmitterMap>`.
 *
 * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html}
 */
export abstract class QMPCommands extends EventEmitter<QMPEventEmitterMap> {
  /**
   * Send a raw QMP command and return the typed response.
   * Implementations must serialize `command` + optional `args` into a QMP
   * `{ "execute": command, "arguments": args }` frame and resolve with the
   * `"return"` field of the response.
   */
  abstract execute<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>;

  // ── VM run state ────────────────────────────────────────────────────────────

  /**
   * Query the current run state of the VM.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-status}
   */
  queryStatus(): Promise<StatusInfo> {
    return this.execute("query-status");
  }

  /**
   * Pause (stop) VM execution. The `STOP` event is emitted after the VM halts.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#stop}
   */
  stop(): Promise<void> {
    return this.execute("stop").then(() => undefined);
  }

  /**
   * Resume (continue) VM execution. The `RESUME` event is emitted after the VM continues.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#cont}
   */
  cont(): Promise<void> {
    return this.execute("cont").then(() => undefined);
  }

  /**
   * Perform a hard reset of the VM. The `RESET` event is emitted after the reset.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#system-reset}
   */
  systemReset(): Promise<void> {
    return this.execute("system_reset").then(() => undefined);
  }

  /**
   * Request an ACPI system powerdown. The guest handles the actual shutdown;
   * the `SHUTDOWN` event fires when the guest powers off.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#system-powerdown}
   */
  systemPowerdown(): Promise<void> {
    return this.execute("system_powerdown").then(() => undefined);
  }

  /**
   * Quit the QEMU process immediately.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#quit}
   */
  quit(): Promise<void> {
    return this.execute("quit").then(() => undefined);
  }

  /**
   * Configure the action taken on reboot, shutdown, panic, or watchdog events.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#set-action}
   */
  setAction(opts: SetActionOptions): Promise<void> {
    return this.execute("set-action", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  // ── Block / storage ─────────────────────────────────────────────────────────

  /**
   * Return a list of all block devices attached to the VM.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-block}
   */
  queryBlock(): Promise<BlockInfo[]> {
    return this.execute("query-block");
  }

  /**
   * Return I/O statistics for all block devices.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-blockstats}
   */
  queryBlockStats(): Promise<BlockStats[]> {
    return this.execute("query-blockstats");
  }

  /**
   * Return a list of all active block jobs (backup, mirror, stream, commit).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-block-jobs}
   */
  queryBlockJobs(): Promise<BlockJobInfo[]> {
    return this.execute("query-block-jobs");
  }

  /**
   * Return a list of all named block driver nodes in the block graph.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-named-block-nodes}
   */
  queryNamedBlockNodes(): Promise<BlockDeviceInfo[]> {
    return this.execute("query-named-block-nodes");
  }

  /**
   * Start a point-in-time backup of a block device to a target.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#blockdev-backup}
   */
  blockdevBackup(opts: BlockdevBackupOptions): Promise<void> {
    return this.execute("blockdev-backup", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Start a mirror operation — replicate a block device to a target,
   * then optionally pivot to the target.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#blockdev-mirror}
   */
  blockdevMirror(opts: BlockdevMirrorOptions): Promise<void> {
    return this.execute("blockdev-mirror", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Stream content from a backing file into a block device.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-stream}
   */
  blockStream(opts: BlockStreamOptions): Promise<void> {
    return this.execute("block-stream", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Commit dirty data from a live block device into its backing file.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-commit}
   */
  blockCommit(opts: BlockCommitOptions): Promise<void> {
    return this.execute("block-commit", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Change the I/O throttle speed for an active block job.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-set-speed}
   */
  blockJobSetSpeed(device: string, speed: number): Promise<void> {
    return this.execute("block-job-set-speed", { device, speed }).then(() => undefined);
  }

  /**
   * Pause an active block job.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-pause}
   */
  blockJobPause(device: string): Promise<void> {
    return this.execute("block-job-pause", { device }).then(() => undefined);
  }

  /**
   * Resume a previously paused block job.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-resume}
   */
  blockJobResume(device: string): Promise<void> {
    return this.execute("block-job-resume", { device }).then(() => undefined);
  }

  /**
   * Cancel an active block job.
   *
   * @param device - The block device identifier.
   * @param force - When `true`, cancel even if the job is paused.
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-cancel}
   */
  blockJobCancel(device: string, force?: boolean): Promise<void> {
    return this.execute("block-job-cancel", { device, ...(force != null && { force }) }).then(
      () => undefined,
    );
  }

  /**
   * Complete (finalize) a ready block job, e.g. pivot a mirror.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-complete}
   */
  blockJobComplete(device: string): Promise<void> {
    return this.execute("block-job-complete", { device }).then(() => undefined);
  }

  /**
   * Pause a generic job by its ID.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-pause}
   */
  jobPause(id: string): Promise<void> {
    return this.execute("job-pause", { id }).then(() => undefined);
  }

  /**
   * Resume a paused generic job.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-resume}
   */
  jobResume(id: string): Promise<void> {
    return this.execute("job-resume", { id }).then(() => undefined);
  }

  /**
   * Cancel a generic job.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-cancel}
   */
  jobCancel(id: string): Promise<void> {
    return this.execute("job-cancel", { id }).then(() => undefined);
  }

  /**
   * Finalize a completed generic job (moves it to the `concluded` state).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-finalize}
   */
  jobComplete(id: string): Promise<void> {
    return this.execute("job-finalize", { id }).then(() => undefined);
  }

  /**
   * Dismiss a concluded job, removing it from the job list.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-dismiss}
   */
  jobDismiss(id: string): Promise<void> {
    return this.execute("job-dismiss", { id }).then(() => undefined);
  }

  /**
   * Return a list of all active generic jobs.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-jobs}
   */
  queryJobs(): Promise<JobInfo[]> {
    return this.execute("query-jobs");
  }

  /**
   * Save a VM snapshot to a target block device.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#snapshot-save}
   */
  snapshotSave(opts: SnapshotSaveOptions): Promise<void> {
    return this.execute("snapshot-save", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Load (restore) a VM snapshot.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#snapshot-load}
   */
  snapshotLoad(opts: SnapshotLoadOptions): Promise<void> {
    return this.execute("snapshot-load", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Delete a VM snapshot.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#snapshot-delete}
   */
  snapshotDelete(opts: SnapshotDeleteOptions): Promise<void> {
    return this.execute("snapshot-delete", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Add a dirty bitmap to track changed blocks on a device.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-add}
   */
  blockDirtyBitmapAdd(opts: BlockDirtyBitmapAdd): Promise<void> {
    return this.execute("block-dirty-bitmap-add", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Remove a dirty bitmap from a device.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-remove}
   */
  blockDirtyBitmapRemove(opts: BlockDirtyBitmapRemove): Promise<void> {
    return this.execute(
      "block-dirty-bitmap-remove",
      opts as unknown as Record<string, unknown>,
    ).then(() => undefined);
  }

  /**
   * Clear all dirty bits in a bitmap without removing it.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-clear}
   */
  blockDirtyBitmapClear(opts: BlockDirtyBitmapClear): Promise<void> {
    return this.execute(
      "block-dirty-bitmap-clear",
      opts as unknown as Record<string, unknown>,
    ).then(() => undefined);
  }

  /**
   * Enable a previously disabled dirty bitmap, resuming change tracking.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-enable}
   */
  blockDirtyBitmapEnable(opts: BlockDirtyBitmapEnable): Promise<void> {
    return this.execute(
      "block-dirty-bitmap-enable",
      opts as unknown as Record<string, unknown>,
    ).then(() => undefined);
  }

  /**
   * Disable a dirty bitmap, pausing change tracking without removing it.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-disable}
   */
  blockDirtyBitmapDisable(opts: BlockDirtyBitmapDisable): Promise<void> {
    return this.execute(
      "block-dirty-bitmap-disable",
      opts as unknown as Record<string, unknown>,
    ).then(() => undefined);
  }

  /**
   * Merge one or more source bitmaps into a target bitmap.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-merge}
   */
  blockDirtyBitmapMerge(opts: BlockDirtyBitmapMerge): Promise<void> {
    return this.execute(
      "block-dirty-bitmap-merge",
      opts as unknown as Record<string, unknown>,
    ).then(() => undefined);
  }

  /**
   * Execute multiple block operations atomically. All actions succeed or all
   * are rolled back.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#transaction}
   */
  transaction(actions: TransactionAction[]): Promise<void> {
    return this.execute("transaction", { actions }).then(() => undefined);
  }

  // ── Device hotplug ──────────────────────────────────────────────────────────

  /**
   * Hotplug a device into the running VM. Emits `DEVICE_ADDED` on success.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#device-add}
   */
  deviceAdd(opts: DeviceAddOptions): Promise<void> {
    return this.execute("device_add", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Request removal of a hotpluggable device. Emits `DEVICE_DELETED` when done.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#device-del}
   */
  deviceDel(id: string): Promise<void> {
    return this.execute("device_del", { id }).then(() => undefined);
  }

  /**
   * Add a network backend (netdev).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#netdev-add}
   */
  netdevAdd(opts: NetdevAddOptions): Promise<void> {
    return this.execute("netdev_add", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Remove a network backend by its ID.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#netdev-del}
   */
  netdevDel(id: string): Promise<void> {
    return this.execute("netdev_del", { id }).then(() => undefined);
  }

  /**
   * Set the link state (up/down) of a network interface.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#set-link}
   */
  setLink(name: string, up: boolean): Promise<void> {
    return this.execute("set_link", { name, up }).then(() => undefined);
  }

  /**
   * Return a list of CPUs that can be hotplugged into the VM.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-hotpluggable-cpus}
   */
  queryHotpluggableCpus(): Promise<HotpluggableCPU[]> {
    return this.execute("query-hotpluggable-cpus");
  }

  /**
   * Return a list of memory devices (e.g. dimm, nvdimm) currently plugged in.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-memory-devices}
   */
  queryMemoryDevices(): Promise<MemoryDeviceInfo[]> {
    return this.execute("query-memory-devices");
  }

  // ── Migration ───────────────────────────────────────────────────────────────

  /**
   * Start a live migration to the given URI.
   *
   * @example
   * ```ts
   * await client.migrate({ uri: "tcp:192.168.1.2:4444" });
   * ```
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate}
   */
  migrate(opts: MigrateOptions): Promise<void> {
    return this.execute("migrate", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Prepare this VM as the incoming side of a migration.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-incoming}
   */
  migrateIncoming(uri: string): Promise<void> {
    return this.execute("migrate-incoming", { uri }).then(() => undefined);
  }

  /**
   * Cancel an in-progress migration.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-cancel}
   */
  migrateCancel(): Promise<void> {
    return this.execute("migrate_cancel").then(() => undefined);
  }

  /**
   * Pause an in-progress migration.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-pause}
   */
  migratePause(): Promise<void> {
    return this.execute("migrate-pause").then(() => undefined);
  }

  /**
   * Continue a paused migration from the given state.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-continue}
   */
  migrateContinue(state: "pre-switchover" | "postcopy-paused"): Promise<void> {
    return this.execute("migrate-continue", { state }).then(() => undefined);
  }

  /**
   * Switch an active migration to post-copy mode.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-start-postcopy}
   */
  migrateStartPostcopy(): Promise<void> {
    return this.execute("migrate-start-postcopy").then(() => undefined);
  }

  /**
   * Enable or disable migration capabilities (e.g. `xbzrle`, `zero-blocks`).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-set-capabilities}
   */
  migrateSetCapabilities(caps: MigrationCapabilityStatus[]): Promise<void> {
    return this.execute("migrate-set-capabilities", { capabilities: caps }).then(() => undefined);
  }

  /**
   * Tune migration parameters (bandwidth, downtime, etc.).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-set-parameters}
   */
  migrateSetParameters(params: Record<string, unknown>): Promise<void> {
    return this.execute("migrate-set-parameters", params).then(() => undefined);
  }

  /**
   * Return the current migration status and statistics.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-migrate}
   */
  queryMigrate(): Promise<MigrationInfo> {
    return this.execute("query-migrate");
  }

  /**
   * Return the current state of all migration capabilities.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-migrate-capabilities}
   */
  queryMigrateCapabilities(): Promise<MigrationCapabilityStatus[]> {
    return this.execute("query-migrate-capabilities");
  }

  /**
   * Return all current migration parameter values.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-migrate-parameters}
   */
  queryMigrateParameters(): Promise<Record<MigrationCapability, unknown>> {
    return this.execute("query-migrate-parameters");
  }

  // ── CPU / memory ────────────────────────────────────────────────────────────

  /**
   * Return a fast summary of all vCPUs (thread IDs, arch state).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-cpus-fast}
   */
  queryCpusFast(): Promise<CpuInfoFast[]> {
    return this.execute("query-cpus-fast");
  }

  /**
   * Return a list of memory backends (memdev objects).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-memdev}
   */
  queryMemdev(): Promise<Memdev[]> {
    return this.execute("query-memdev");
  }

  /**
   * Return the base and plugged memory sizes.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-memory-size-summary}
   */
  queryMemorySizeSummary(): Promise<MemorySizeInfo> {
    return this.execute("query-memory-size-summary");
  }

  /**
   * Return KVM acceleration availability and enablement status.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-kvm}
   */
  queryKvm(): Promise<KvmInfo> {
    return this.execute("query-kvm");
  }

  // ── Display / console ───────────────────────────────────────────────────────

  /**
   * Return information about the VNC server (address, client list, auth).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-vnc}
   */
  queryVnc(): Promise<VncInfo> {
    return this.execute("query-vnc");
  }

  /**
   * Set the password for VNC or SPICE.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#set-password}
   */
  setPassword(opts: SetPasswordOptions): Promise<void> {
    return this.execute("set_password", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Set an expiry time for a VNC or SPICE password.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#expire-password}
   */
  expirePassword(opts: ExpirePasswordOptions): Promise<void> {
    return this.execute("expire_password", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Capture a screenshot of the guest display to a file.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#screendump}
   */
  screendump(opts: ScreendumpOptions): Promise<void> {
    return this.execute("screendump", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Return a list of all character devices.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-chardev}
   */
  queryChardev(): Promise<ChardevInfo[]> {
    return this.execute("query-chardev");
  }

  /**
   * Write data into a ring buffer character device.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#ringbuf-write}
   */
  ringbufWrite(opts: RingbufWriteOptions): Promise<void> {
    return this.execute("ringbuf-write", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Read data from a ring buffer character device.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#ringbuf-read}
   */
  ringbufRead(opts: RingbufReadOptions): Promise<string> {
    return this.execute("ringbuf-read", opts as unknown as Record<string, unknown>);
  }

  // ── Introspection ───────────────────────────────────────────────────────────

  /**
   * Return QEMU version information.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-version}
   */
  queryVersion(): Promise<VersionInfo> {
    return this.execute("query-version");
  }

  /**
   * Return a list of all QMP commands supported by this QEMU build.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-commands}
   */
  queryCommands(): Promise<CommandInfo[]> {
    return this.execute("query-commands");
  }

  /**
   * Return the full QMP schema (types, commands, events) for this QEMU build.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-qmp-schema}
   */
  queryQmpSchema(): Promise<SchemaInfo[]> {
    return this.execute("query-qmp-schema");
  }

  // ── QOM ─────────────────────────────────────────────────────────────────────

  /**
   * List child objects and properties of a QOM object at `path`.
   *
   * @example
   * ```ts
   * const items = await client.qomList("/machine");
   * ```
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-list}
   */
  qomList(path: string): Promise<Array<{ name: string; type: string }>> {
    return this.execute("qom-list", { path });
  }

  /**
   * Get the value of a QOM property.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-get}
   */
  qomGet(path: string, property: string): Promise<unknown> {
    return this.execute("qom-get", { path, property });
  }

  /**
   * Set a QOM property to the given value.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-set}
   */
  qomSet(path: string, property: string, value: unknown): Promise<void> {
    return this.execute("qom-set", { path, property, value }).then(() => undefined);
  }

  /**
   * List QOM object types, optionally filtered by interface or abstractness.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-list-types}
   */
  qomListTypes(opts?: {
    implements?: string;
    abstract?: boolean;
  }): Promise<Array<{ name: string; abstract?: boolean; parent?: string }>> {
    return this.execute("qom-list-types", opts as Record<string, unknown>);
  }

  /**
   * List properties of a device type by its QOM type name.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#device-list-properties}
   */
  qomListProperties(typename: string): Promise<Array<{ name: string; type: string }>> {
    return this.execute("device-list-properties", { typename });
  }

  // ── VM identity ─────────────────────────────────────────────────────────────

  /**
   * Return the UUID of the VM as configured by `-uuid` or `-machine`.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-uuid}
   */
  queryUuid(): Promise<{ UUID: string }> {
    return this.execute("query-uuid");
  }

  /**
   * Return the name of the VM as set by `-name`.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-name}
   */
  queryName(): Promise<{ name?: string }> {
    return this.execute("query-name");
  }

  // ── QOM object management ───────────────────────────────────────────────────

  /**
   * Create a QOM object at runtime (e.g. a memory backend, iothread, secret).
   *
   * @example
   * ```ts
   * await client.objectAdd({
   *   "qom-type": "memory-backend-ram",
   *   id: "mem1",
   *   props: { size: 1073741824 },
   * });
   * ```
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#object-add}
   */
  objectAdd(opts: ObjectAddOptions): Promise<void> {
    return this.execute("object-add", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Delete a QOM object created with `object-add`.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#object-del}
   */
  objectDel(id: string): Promise<void> {
    return this.execute("object-del", { id }).then(() => undefined);
  }

  // ── Chardev hotplug ─────────────────────────────────────────────────────────

  /**
   * Add a character device at runtime. Returns the PTY path for `pty` backends.
   *
   * @example
   * ```ts
   * const { pty } = await client.chardevAdd({
   *   id: "serial1",
   *   backend: { type: "pty", data: {} },
   * });
   * ```
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#chardev-add}
   */
  chardevAdd(opts: ChardevAddOptions): Promise<ChardevReturn> {
    return this.execute("chardev-add", opts as unknown as Record<string, unknown>);
  }

  /**
   * Change the backend of an existing character device without removing it.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#chardev-change}
   */
  chardevChange(opts: ChardevChangeOptions): Promise<void> {
    return this.execute("chardev-change", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Remove a character device added with `chardev-add`.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#chardev-remove}
   */
  chardevRemove(id: string): Promise<void> {
    return this.execute("chardev-remove", { id }).then(() => undefined);
  }

  // ── IO threads ──────────────────────────────────────────────────────────────

  /**
   * Return a list of all IO threads and their polling configuration.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-iothreads}
   */
  queryIothreads(): Promise<IoThreadInfo[]> {
    return this.execute("query-iothreads");
  }

  // ── Memory dump ─────────────────────────────────────────────────────────────

  /**
   * Dump guest memory to a file. Use `detach: true` to run in the background
   * and listen for the `DUMP_COMPLETED` event.
   *
   * @example
   * ```ts
   * await client.dumpGuestMemory({ paging: false, protocol: "file:/tmp/dump.elf" });
   * ```
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#dump-guest-memory}
   */
  dumpGuestMemory(opts: DumpGuestMemoryOptions): Promise<void> {
    return this.execute("dump-guest-memory", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  // ── Display / VNC / SPICE ───────────────────────────────────────────────────

  /**
   * Inject a pre-authenticated client connection into VNC or SPICE using a
   * file descriptor passed over SCM_RIGHTS.
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#add-client}
   */
  addClient(opts: AddClientOptions): Promise<void> {
    return this.execute("add_client", opts as unknown as Record<string, unknown>).then(
      () => undefined,
    );
  }

  /**
   * Return the active display configuration (type and backend options).
   *
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-display-options}
   */
  queryDisplayOptions(): Promise<DisplayOptions> {
    return this.execute("query-display-options");
  }

  // ── Human Monitor Protocol ──────────────────────────────────────────────────

  /**
   * Execute an arbitrary HMP (Human Monitor Protocol) command and return the
   * text output. Use as an escape hatch for commands not yet available in QMP.
   *
   * @example
   * ```ts
   * const out = await client.humanMonitorCommand("info pci");
   * ```
   * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#human-monitor-command}
   */
  humanMonitorCommand(commandLine: string): Promise<string> {
    return this.execute("human-monitor-command", { "command-line": commandLine });
  }
}
