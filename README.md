<div align="center">

# node-qemu

QEMU management library for Node.js

[![npm](https://img.shields.io/npm/v/node-qemu)](https://www.npmjs.com/package/node-qemu)
[![CI](https://github.com/SourceRegistry/node-qemu/actions/workflows/ci.yml/badge.svg)](https://github.com/SourceRegistry/node-qemu/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/node-qemu)](LICENSE)

Typed QMP client, process lifecycle manager, and `qemu-img` wrappers -
all in pure TypeScript with no native bindings.

</div>

## Features

- **QMP client** - typed JSON-RPC over Unix socket or TCP, full capability negotiation, sequential command dispatch, typed async events
- **60+ typed QMP commands** - VM control, block/storage, device hotplug, migration, CPU/memory, display, introspection, QOM
- **Process manager** - spawn, monitor, and gracefully stop QEMU processes; PID files; stdout/stderr streams
- **CLI argument builder** - convert a typed `QemuConfig` into a validated `string[]` argv
- **Image tools** - typed wrappers around `qemu-img`: create, resize, convert, info, check, snapshots
- **AsyncDisposable** - `await using` support on `QMPClient` and `QemuProcess`
- **Automatic reconnect** - exponential backoff on unexpected disconnect (opt-in)
- Dual ESM + CJS output, TypeScript source maps, full `.d.ts` declarations

## Installation

```sh
npm install node-qemu
```

Requires Node.js ≥ 18 and `qemu-system-*` / `qemu-img` binaries on the host.

## Quick Start

### QMP Client

```ts
import { QMPClient } from "node-qemu";

await using client = new QMPClient({ socketPath: "/run/qemu/vm1.sock" });
await client.connect();

// Typed command
const status = await client.queryStatus();
console.log(status.status); // "running" | "paused" | ...

// Typed events
client.on("SHUTDOWN", (e) => console.log("Guest shut down:", e.reason));
client.on("BLOCK_JOB_COMPLETED", (e) => console.log("Backup done:", e.device));
client.on("MIGRATION", (e) => console.log("Migration:", e.status));

// Pause and resume
await client.stop();
await client.cont();

// Graceful shutdown
await client.systemPowerdown();
```

### Process Manager

```ts
import { QemuProcess, QMPClient } from "node-qemu";

const proc = new QemuProcess({
  binary: "/usr/bin/qemu-system-x86_64",
  config: {
    machine: { type: "q35", accel: "kvm" },
    cpu: "host",
    memory: { size: 2048 },
    drives: [{ file: "/var/lib/qemu/vm1.qcow2", format: "qcow2", virtio: true }],
    net: [{ type: "tap", ifname: "tap0", script: "no", vhost: true }],
    qmp: { socketPath: "/run/qemu/vm1.sock" },
    vnc: { display: "0" },
    enableKvm: true,
    noReboot: true,
    pidfile: "/run/qemu/vm1.pid",
  },
});

await proc.start();
console.log("QEMU PID:", proc.pid);

proc.on("stderr", (line) => console.error("[qemu]", line));
proc.on("exit", (code, signal) => console.log("Exited", { code, signal }));

// Connect QMP after process starts
await using client = new QMPClient({ socketPath: proc.socketPath! });
await client.connect();

// Graceful stop - SIGTERM with 5s SIGKILL fallback
await proc.stop();
```

### Image Tools

```ts
import { QemuImg } from "node-qemu";

// Create a thin-provisioned overlay over a base image
await QemuImg.create({
  filename: "/var/lib/qemu/vm1.qcow2",
  format: "qcow2",
  size: "20G",
  backingFile: "/var/lib/qemu/base.qcow2",
});

// Resize in place
await QemuImg.resize({ filename: "/var/lib/qemu/vm1.qcow2", size: "+10G" });

// Convert raw → qcow2 with compression
await QemuImg.convert({
  src: "/var/lib/qemu/vm1.raw",
  dst: "/var/lib/qemu/vm1.qcow2",
  format: "qcow2",
  compress: true,
});

// Inspect
const info = await QemuImg.info({ filename: "/var/lib/qemu/vm1.qcow2" });
console.log(info.format, info.virtualSize, info.backingFile);

// Internal qcow2 snapshots
await QemuImg.snapshotCreate({ filename: "/var/lib/qemu/vm1.qcow2", tag: "clean" });
const snaps = await QemuImg.snapshotList({ filename: "/var/lib/qemu/vm1.qcow2" });
await QemuImg.snapshotApply({ filename: "/var/lib/qemu/vm1.qcow2", tag: "clean" });
await QemuImg.snapshotDelete({ filename: "/var/lib/qemu/vm1.qcow2", tag: "clean" });
```

## TCP Connection

```ts
const client = new QMPClient({ host: "192.168.1.10", port: 4444 });
await client.connect();
```

## Automatic Reconnect

```ts
const client = new QMPClient({
  socketPath: "/run/qemu/vm1.sock",
  reconnect: true,
  reconnectDelay: 1000,    // initial delay ms (doubles on each attempt)
  reconnectMaxDelay: 30_000,
});

client.on("disconnected", () => console.log("Lost connection, retrying..."));
client.on("connected", () => console.log("Reconnected"));
```

## Incremental Backup with Dirty Bitmaps

```ts
// Track changed blocks since last backup
await client.blockDirtyBitmapAdd({ node: "hd0", name: "inc-backup" });

// ... time passes, guest writes data ...

// Incremental backup using the bitmap
await client.blockdevBackup({
  device: "hd0",
  target: "backup-target",
  sync: "incremental",
  bitmap: "inc-backup",
});

// Monitor completion
client.once("BLOCK_JOB_COMPLETED", async (e) => {
  console.log("Backup complete:", e.device);
  await client.blockDirtyBitmapClear({ node: "hd0", name: "inc-backup" });
});
```

## Live Migration

```ts
await client.migrateSetCapabilities([
  { capability: "xbzrle", state: true },
  { capability: "auto-converge", state: true },
]);

await client.migrate({ uri: "tcp:192.168.1.2:4444" });

client.on("MIGRATION", (e) => {
  if (e.status === "completed") console.log("Migration done");
  if (e.status === "failed")    console.error("Migration failed");
});
```

## Error Handling

```ts
import { QmpError, QmpCommandError } from "node-qemu";

try {
  await client.blockdevBackup({ device: "hd0", target: "missing", sync: "full" });
} catch (err) {
  if (err instanceof QmpCommandError) {
    console.error(err.qmpClass, err.description); // "DeviceNotFound" "..."
  } else if (err instanceof QmpError) {
    console.error(err.code); // "CONNECTION_CLOSED" | "CLIENT_CLOSED" | ...
  }
}
```

## Events

`QMPClient` extends `EventEmitter` with fully typed payloads:

| Event | Payload | Description |
|---|---|---|
| `SHUTDOWN` | `ShutdownEvent` | Guest or host-initiated shutdown |
| `RESET` | `ResetEvent` | System reset |
| `STOP` | - | VM execution paused |
| `RESUME` | - | VM execution resumed |
| `GUEST_PANICKED` | `GuestPanicEvent` | Guest kernel panic |
| `WATCHDOG` | `WatchdogEvent` | Watchdog timer fired |
| `BLOCK_IO_ERROR` | `BlockIoErrorEvent` | Block device I/O error |
| `BLOCK_JOB_COMPLETED` | `BlockJobEvent` | Backup/mirror/stream finished |
| `BLOCK_JOB_CANCELLED` | `BlockJobEvent` | Block job cancelled |
| `BLOCK_JOB_ERROR` | `BlockJobErrorEvent` | Block job I/O error |
| `BLOCK_JOB_READY` | `BlockJobEvent` | Mirror ready to pivot |
| `JOB_STATUS_CHANGE` | `JobStatusChangeEvent` | Generic job status changed |
| `DEVICE_ADDED` | `DeviceEvent` | Hotplug device added |
| `DEVICE_DELETED` | `DeviceEvent` | Hotplug device removed |
| `MIGRATION` | `MigrationEvent` | Migration status update |
| `MIGRATION_PASS` | `MigrationPassEvent` | Migration pass counter |
| `NIC_RX_FILTER_CHANGED` | `NicRxFilterEvent` | NIC RX filter updated |
| `VNC_CONNECTED` | `VncEvent` | VNC client connected |
| `VNC_DISCONNECTED` | `VncEvent` | VNC client disconnected |
| `MEMORY_FAILURE` | `MemoryFailureEvent` | Hardware memory failure |
| `SUSPEND` | - | Guest suspended |
| `WAKEUP` | - | Guest woke up |
| `DUMP_COMPLETED` | `DumpCompletedEvent` | Guest memory dump finished |
| `NETDEV_STREAM_CONNECTED` / `_DISCONNECTED` | `NetdevStreamEvent` | Stream-based netdev backend (dis)connected |
| `NETDEV_VHOST_USER_CONNECTED` / `_DISCONNECTED` | `NetdevStreamEvent` | vhost-user netdev backend (dis)connected |
| `FAILOVER_NEGOTIATED` | `FailoverNegotiatedEvent` | Failover primary device negotiation done |
| `BLOCK_EXPORT_DELETED` | `BlockExportDeletedEvent` | A block export was torn down |
| `BALLOON_CHANGE` | `BalloonChangeEvent` | Balloon target size changed |
| `MEMORY_DEVICE_SIZE_CHANGE` | `MemoryDeviceSizeChangeEvent` | Memory device resized at runtime |
| `HV_BALLOON_STATUS_REPORT` | `HvBalloonStatusReportEvent` | Hyper-V dynamic memory status report |
| `DEVICE_UNPLUG_GUEST_ERROR` | `DeviceUnplugGuestErrorEvent` | Guest failed to unplug a requested device |
| `connected` | - | QMP handshake complete |
| `disconnected` | - | Socket closed |
| `error` | `Error` | Transport error |

## API Reference

Full API documentation is available at [sourceregistry.github.io/node-qemu](https://sourceregistry.github.io/node-qemu/).

For the underlying QMP wire protocol, see the [QEMU QMP Reference](https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html) and [qemu-img manual](https://www.qemu.org/docs/master/tools/qemu-img.html).

## Related Libraries

| Library | Role |
|---|---|
| [node-lxc](https://github.com/SourceRegistry/node-lxc) | LXC container lifecycle |
| [node-ovsdb](https://github.com/SourceRegistry/node-ovsdb) | Open vSwitch / OVSDB networking |
| **node-qemu** | QEMU VM lifecycle (this library) |

## License

[Apache-2.0](LICENSE)
