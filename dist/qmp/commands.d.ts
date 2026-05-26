import { EventEmitter } from 'node:events';
import { QMPEventEmitterMap } from './events.js';
import { StatusInfo, VersionInfo, CommandInfo, SchemaInfo, BlockInfo, BlockStats, BlockJobInfo, BlockDeviceInfo, JobInfo, CpuInfoFast, MemorySizeInfo, Memdev, KvmInfo, VncInfo, ChardevInfo, MigrationInfo, MigrationCapabilityStatus, HotpluggableCPU, MemoryDeviceInfo, SetActionOptions, TransactionAction, SnapshotSaveOptions, SnapshotLoadOptions, SnapshotDeleteOptions, BlockDirtyBitmapAdd, BlockDirtyBitmapRemove, BlockDirtyBitmapClear, BlockDirtyBitmapEnable, BlockDirtyBitmapDisable, BlockDirtyBitmapMerge, BlockdevBackupOptions, BlockdevMirrorOptions, BlockStreamOptions, BlockCommitOptions, DeviceAddOptions, NetdevAddOptions, MigrateOptions, MigrationCapability, SetPasswordOptions, ExpirePasswordOptions, ScreendumpOptions, RingbufWriteOptions, RingbufReadOptions, IoThreadInfo, ChardevReturn, ChardevAddOptions, ChardevChangeOptions, ObjectAddOptions, DumpGuestMemoryOptions, AddClientOptions, DisplayOptions } from './types.js';
/**
 * Abstract base providing typed QMP command methods over {@link execute}.
 * Inherits typed `.on()`, `.once()`, `.off()`, and `.emit()` from `EventEmitter<QMPEventEmitterMap>`.
 *
 * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html}
 */
export declare abstract class QMPCommands extends EventEmitter<QMPEventEmitterMap> {
    /**
     * Send a raw QMP command and return the typed response.
     * Implementations must serialize `command` + optional `args` into a QMP
     * `{ "execute": command, "arguments": args }` frame and resolve with the
     * `"return"` field of the response.
     */
    abstract execute<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>;
    /**
     * Query the current run state of the VM.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-status}
     */
    queryStatus(): Promise<StatusInfo>;
    /**
     * Pause (stop) VM execution. The `STOP` event is emitted after the VM halts.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#stop}
     */
    stop(): Promise<void>;
    /**
     * Resume (continue) VM execution. The `RESUME` event is emitted after the VM continues.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#cont}
     */
    cont(): Promise<void>;
    /**
     * Perform a hard reset of the VM. The `RESET` event is emitted after the reset.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#system-reset}
     */
    systemReset(): Promise<void>;
    /**
     * Request an ACPI system powerdown. The guest handles the actual shutdown;
     * the `SHUTDOWN` event fires when the guest powers off.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#system-powerdown}
     */
    systemPowerdown(): Promise<void>;
    /**
     * Quit the QEMU process immediately.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#quit}
     */
    quit(): Promise<void>;
    /**
     * Configure the action taken on reboot, shutdown, panic, or watchdog events.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#set-action}
     */
    setAction(opts: SetActionOptions): Promise<void>;
    /**
     * Return a list of all block devices attached to the VM.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-block}
     */
    queryBlock(): Promise<BlockInfo[]>;
    /**
     * Return I/O statistics for all block devices.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-blockstats}
     */
    queryBlockStats(): Promise<BlockStats[]>;
    /**
     * Return a list of all active block jobs (backup, mirror, stream, commit).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-block-jobs}
     */
    queryBlockJobs(): Promise<BlockJobInfo[]>;
    /**
     * Return a list of all named block driver nodes in the block graph.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-named-block-nodes}
     */
    queryNamedBlockNodes(): Promise<BlockDeviceInfo[]>;
    /**
     * Start a point-in-time backup of a block device to a target.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#blockdev-backup}
     */
    blockdevBackup(opts: BlockdevBackupOptions): Promise<void>;
    /**
     * Start a mirror operation — replicate a block device to a target,
     * then optionally pivot to the target.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#blockdev-mirror}
     */
    blockdevMirror(opts: BlockdevMirrorOptions): Promise<void>;
    /**
     * Stream content from a backing file into a block device.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-stream}
     */
    blockStream(opts: BlockStreamOptions): Promise<void>;
    /**
     * Commit dirty data from a live block device into its backing file.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-commit}
     */
    blockCommit(opts: BlockCommitOptions): Promise<void>;
    /**
     * Change the I/O throttle speed for an active block job.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-set-speed}
     */
    blockJobSetSpeed(device: string, speed: number): Promise<void>;
    /**
     * Pause an active block job.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-pause}
     */
    blockJobPause(device: string): Promise<void>;
    /**
     * Resume a previously paused block job.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-resume}
     */
    blockJobResume(device: string): Promise<void>;
    /**
     * Cancel an active block job.
     *
     * @param device - The block device identifier.
     * @param force - When `true`, cancel even if the job is paused.
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-cancel}
     */
    blockJobCancel(device: string, force?: boolean): Promise<void>;
    /**
     * Complete (finalize) a ready block job, e.g. pivot a mirror.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-job-complete}
     */
    blockJobComplete(device: string): Promise<void>;
    /**
     * Pause a generic job by its ID.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-pause}
     */
    jobPause(id: string): Promise<void>;
    /**
     * Resume a paused generic job.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-resume}
     */
    jobResume(id: string): Promise<void>;
    /**
     * Cancel a generic job.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-cancel}
     */
    jobCancel(id: string): Promise<void>;
    /**
     * Finalize a completed generic job (moves it to the `concluded` state).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-finalize}
     */
    jobComplete(id: string): Promise<void>;
    /**
     * Dismiss a concluded job, removing it from the job list.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#job-dismiss}
     */
    jobDismiss(id: string): Promise<void>;
    /**
     * Return a list of all active generic jobs.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-jobs}
     */
    queryJobs(): Promise<JobInfo[]>;
    /**
     * Save a VM snapshot to a target block device.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#snapshot-save}
     */
    snapshotSave(opts: SnapshotSaveOptions): Promise<void>;
    /**
     * Load (restore) a VM snapshot.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#snapshot-load}
     */
    snapshotLoad(opts: SnapshotLoadOptions): Promise<void>;
    /**
     * Delete a VM snapshot.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#snapshot-delete}
     */
    snapshotDelete(opts: SnapshotDeleteOptions): Promise<void>;
    /**
     * Add a dirty bitmap to track changed blocks on a device.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-add}
     */
    blockDirtyBitmapAdd(opts: BlockDirtyBitmapAdd): Promise<void>;
    /**
     * Remove a dirty bitmap from a device.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-remove}
     */
    blockDirtyBitmapRemove(opts: BlockDirtyBitmapRemove): Promise<void>;
    /**
     * Clear all dirty bits in a bitmap without removing it.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-clear}
     */
    blockDirtyBitmapClear(opts: BlockDirtyBitmapClear): Promise<void>;
    /**
     * Enable a previously disabled dirty bitmap, resuming change tracking.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-enable}
     */
    blockDirtyBitmapEnable(opts: BlockDirtyBitmapEnable): Promise<void>;
    /**
     * Disable a dirty bitmap, pausing change tracking without removing it.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-disable}
     */
    blockDirtyBitmapDisable(opts: BlockDirtyBitmapDisable): Promise<void>;
    /**
     * Merge one or more source bitmaps into a target bitmap.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#block-dirty-bitmap-merge}
     */
    blockDirtyBitmapMerge(opts: BlockDirtyBitmapMerge): Promise<void>;
    /**
     * Execute multiple block operations atomically. All actions succeed or all
     * are rolled back.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#transaction}
     */
    transaction(actions: TransactionAction[]): Promise<void>;
    /**
     * Hotplug a device into the running VM. Emits `DEVICE_ADDED` on success.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#device-add}
     */
    deviceAdd(opts: DeviceAddOptions): Promise<void>;
    /**
     * Request removal of a hotpluggable device. Emits `DEVICE_DELETED` when done.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#device-del}
     */
    deviceDel(id: string): Promise<void>;
    /**
     * Add a network backend (netdev).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#netdev-add}
     */
    netdevAdd(opts: NetdevAddOptions): Promise<void>;
    /**
     * Remove a network backend by its ID.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#netdev-del}
     */
    netdevDel(id: string): Promise<void>;
    /**
     * Set the link state (up/down) of a network interface.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#set-link}
     */
    setLink(name: string, up: boolean): Promise<void>;
    /**
     * Return a list of CPUs that can be hotplugged into the VM.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-hotpluggable-cpus}
     */
    queryHotpluggableCpus(): Promise<HotpluggableCPU[]>;
    /**
     * Return a list of memory devices (e.g. dimm, nvdimm) currently plugged in.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-memory-devices}
     */
    queryMemoryDevices(): Promise<MemoryDeviceInfo[]>;
    /**
     * Start a live migration to the given URI.
     *
     * @example
     * ```ts
     * await client.migrate({ uri: "tcp:192.168.1.2:4444" });
     * ```
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate}
     */
    migrate(opts: MigrateOptions): Promise<void>;
    /**
     * Prepare this VM as the incoming side of a migration.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-incoming}
     */
    migrateIncoming(uri: string): Promise<void>;
    /**
     * Cancel an in-progress migration.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-cancel}
     */
    migrateCancel(): Promise<void>;
    /**
     * Pause an in-progress migration.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-pause}
     */
    migratePause(): Promise<void>;
    /**
     * Continue a paused migration from the given state.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-continue}
     */
    migrateContinue(state: "pre-switchover" | "postcopy-paused"): Promise<void>;
    /**
     * Switch an active migration to post-copy mode.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-start-postcopy}
     */
    migrateStartPostcopy(): Promise<void>;
    /**
     * Enable or disable migration capabilities (e.g. `xbzrle`, `zero-blocks`).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-set-capabilities}
     */
    migrateSetCapabilities(caps: MigrationCapabilityStatus[]): Promise<void>;
    /**
     * Tune migration parameters (bandwidth, downtime, etc.).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#migrate-set-parameters}
     */
    migrateSetParameters(params: Record<string, unknown>): Promise<void>;
    /**
     * Return the current migration status and statistics.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-migrate}
     */
    queryMigrate(): Promise<MigrationInfo>;
    /**
     * Return the current state of all migration capabilities.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-migrate-capabilities}
     */
    queryMigrateCapabilities(): Promise<MigrationCapabilityStatus[]>;
    /**
     * Return all current migration parameter values.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-migrate-parameters}
     */
    queryMigrateParameters(): Promise<Record<MigrationCapability, unknown>>;
    /**
     * Return a fast summary of all vCPUs (thread IDs, arch state).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-cpus-fast}
     */
    queryCpusFast(): Promise<CpuInfoFast[]>;
    /**
     * Return a list of memory backends (memdev objects).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-memdev}
     */
    queryMemdev(): Promise<Memdev[]>;
    /**
     * Return the base and plugged memory sizes.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-memory-size-summary}
     */
    queryMemorySizeSummary(): Promise<MemorySizeInfo>;
    /**
     * Return KVM acceleration availability and enablement status.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-kvm}
     */
    queryKvm(): Promise<KvmInfo>;
    /**
     * Return information about the VNC server (address, client list, auth).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-vnc}
     */
    queryVnc(): Promise<VncInfo>;
    /**
     * Set the password for VNC or SPICE.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#set-password}
     */
    setPassword(opts: SetPasswordOptions): Promise<void>;
    /**
     * Set an expiry time for a VNC or SPICE password.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#expire-password}
     */
    expirePassword(opts: ExpirePasswordOptions): Promise<void>;
    /**
     * Capture a screenshot of the guest display to a file.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#screendump}
     */
    screendump(opts: ScreendumpOptions): Promise<void>;
    /**
     * Return a list of all character devices.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-chardev}
     */
    queryChardev(): Promise<ChardevInfo[]>;
    /**
     * Write data into a ring buffer character device.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#ringbuf-write}
     */
    ringbufWrite(opts: RingbufWriteOptions): Promise<void>;
    /**
     * Read data from a ring buffer character device.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#ringbuf-read}
     */
    ringbufRead(opts: RingbufReadOptions): Promise<string>;
    /**
     * Return QEMU version information.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-version}
     */
    queryVersion(): Promise<VersionInfo>;
    /**
     * Return a list of all QMP commands supported by this QEMU build.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-commands}
     */
    queryCommands(): Promise<CommandInfo[]>;
    /**
     * Return the full QMP schema (types, commands, events) for this QEMU build.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-qmp-schema}
     */
    queryQmpSchema(): Promise<SchemaInfo[]>;
    /**
     * List child objects and properties of a QOM object at `path`.
     *
     * @example
     * ```ts
     * const items = await client.qomList("/machine");
     * ```
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-list}
     */
    qomList(path: string): Promise<Array<{
        name: string;
        type: string;
    }>>;
    /**
     * Get the value of a QOM property.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-get}
     */
    qomGet(path: string, property: string): Promise<unknown>;
    /**
     * Set a QOM property to the given value.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-set}
     */
    qomSet(path: string, property: string, value: unknown): Promise<void>;
    /**
     * List QOM object types, optionally filtered by interface or abstractness.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#qom-list-types}
     */
    qomListTypes(opts?: {
        implements?: string;
        abstract?: boolean;
    }): Promise<Array<{
        name: string;
        abstract?: boolean;
        parent?: string;
    }>>;
    /**
     * List properties of a device type by its QOM type name.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#device-list-properties}
     */
    qomListProperties(typename: string): Promise<Array<{
        name: string;
        type: string;
    }>>;
    /**
     * Return the UUID of the VM as configured by `-uuid` or `-machine`.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-uuid}
     */
    queryUuid(): Promise<{
        UUID: string;
    }>;
    /**
     * Return the name of the VM as set by `-name`.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-name}
     */
    queryName(): Promise<{
        name?: string;
    }>;
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
    objectAdd(opts: ObjectAddOptions): Promise<void>;
    /**
     * Delete a QOM object created with `object-add`.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#object-del}
     */
    objectDel(id: string): Promise<void>;
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
    chardevAdd(opts: ChardevAddOptions): Promise<ChardevReturn>;
    /**
     * Change the backend of an existing character device without removing it.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#chardev-change}
     */
    chardevChange(opts: ChardevChangeOptions): Promise<void>;
    /**
     * Remove a character device added with `chardev-add`.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#chardev-remove}
     */
    chardevRemove(id: string): Promise<void>;
    /**
     * Return a list of all IO threads and their polling configuration.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-iothreads}
     */
    queryIothreads(): Promise<IoThreadInfo[]>;
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
    dumpGuestMemory(opts: DumpGuestMemoryOptions): Promise<void>;
    /**
     * Inject a pre-authenticated client connection into VNC or SPICE using a
     * file descriptor passed over SCM_RIGHTS.
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#add-client}
     */
    addClient(opts: AddClientOptions): Promise<void>;
    /**
     * Return the active display configuration (type and backend options).
     *
     * @see {@link https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html#query-display-options}
     */
    queryDisplayOptions(): Promise<DisplayOptions>;
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
    humanMonitorCommand(commandLine: string): Promise<string>;
}
//# sourceMappingURL=commands.d.ts.map