/**
 * Basic VM example: create a qcow2 image, start a QEMU process, connect via
 * QMP, query status, then shut down.
 */
import { QemuProcess, QMPClient, QemuImg } from "../../src/index.js";

const IMAGE = "/tmp/example.qcow2";
const SOCK = "/tmp/qemu-example.sock";

await QemuImg.create({ filename: IMAGE, format: "qcow2", size: "4G" });
console.log("Image created:", IMAGE);

const proc = new QemuProcess({
  binary: "qemu-system-x86_64",
  config: {
    machine: { type: "q35", accel: "kvm" },
    cpu: "host",
    memory: { size: 512 },
    drives: [{ file: IMAGE, format: "qcow2", cache: "none", aio: "native" }],
    net: [{ type: "none" }],
    qmp: { socketPath: SOCK },
    noReboot: true,
    noShutdown: true,
    extraArgs: ["-nographic"],
  },
});

proc.on("stderr", (line) => process.stderr.write(line));
proc.on("exit", (code, signal) => console.log("QEMU exited:", code, signal));

await proc.start();
console.log("QEMU started, pid:", proc.pid);

// Give the socket a moment to appear
await new Promise((r) => setTimeout(r, 500));

await using client = new QMPClient({ socketPath: SOCK });
await client.connect();
console.log("QMP connected");

const status = await client.queryStatus();
console.log("VM status:", status.status);

const version = await client.queryVersion();
console.log("QEMU version:", version.qemu);

await client.systemPowerdown();
console.log("Powerdown requested");

await proc.stop(10_000);
console.log("Process stopped");
