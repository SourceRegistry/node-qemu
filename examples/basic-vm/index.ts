/**
 * Basic VM example: create a qcow2 image, start a QEMU process, connect via
 * QMP, query status, then shut down.
 *
 * Uses TCP for QMP — Unix sockets are not supported by QEMU on Windows.
 */
import { QemuProcess, QMPClient, QemuImg } from "../../src/index.js";

const IMAGE = "C:\\Users\\alexa\\WebstormProjects\\github.com\\SourceRegistry\\node-qemu\\tmp\\example.qcow2";
const QMP_PORT = 4447;

await QemuImg.create({ filename: IMAGE, format: "qcow2", size: "4G" });
console.log("Image created:", IMAGE);

const proc = new QemuProcess({
  config: {
    machine: { type: "q35", accel: "whpx" },
    cpu: "host",
    memory: { size: 512 },
    drives: [{ file: IMAGE, format: "qcow2", cache: "writeback" }],
    net: [{ type: "none" }],
    qmp: { host: "127.0.0.1", port: QMP_PORT },
    noReboot: true,
    noShutdown: true,
  },
});

proc.on("stderr", (line) => process.stderr.write(line));
proc.on("exit", (code, signal) => console.log("QEMU exited:", code, signal));

await proc.start();
console.log("QEMU started, pid:", proc.pid);

// Give QEMU a moment to bind the QMP port
await new Promise((r) => setTimeout(r, 800));

await using client = new QMPClient({ host: "127.0.0.1", port: QMP_PORT });
await client.connect();
console.log("QMP connected");

const status = await client.queryStatus();
console.log("VM status:", status.status);

const version = await client.queryVersion();
console.log("QEMU version:", version.qemu);

// await client.quit();
// console.log("VM quit");
//
// await proc.stop(5_000);
// console.log("Process stopped");
