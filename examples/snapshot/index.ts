/**
 * Snapshot example: create a running VM snapshot via QMP, then restore it.
 * Requires a running QEMU instance at /tmp/qemu-snap.sock.
 */
import { QMPClient } from "../../src/index.js";

const SOCK = "/tmp/qemu-snap.sock";

await using client = new QMPClient({ socketPath: SOCK });
await client.connect();

console.log("Saving VM snapshot 'checkpoint-1'...");
await client.snapshotSave({
  "job-id": "snap-save-1",
  tag: "checkpoint-1",
  vmstate: "hd0",
  devices: ["hd0"],
});

// Wait for JOB_STATUS_CHANGE → concluded
await new Promise<void>((resolve, reject) => {
  client.on("JOB_STATUS_CHANGE", (ev) => {
    if (ev.id === "snap-save-1") {
      if (ev.status === "concluded") resolve();
      else if (ev.status === "aborting") reject(new Error("Snapshot save aborted"));
    }
  });
});

console.log("Snapshot saved. Dismissing job...");
await client.jobDismiss("snap-save-1");

console.log("Restoring snapshot 'checkpoint-1'...");
await client.snapshotLoad({
  "job-id": "snap-load-1",
  tag: "checkpoint-1",
  vmstate: "hd0",
  devices: ["hd0"],
});

await new Promise<void>((resolve, reject) => {
  client.on("JOB_STATUS_CHANGE", (ev) => {
    if (ev.id === "snap-load-1") {
      if (ev.status === "concluded") resolve();
      else if (ev.status === "aborting") reject(new Error("Snapshot load aborted"));
    }
  });
});

await client.jobDismiss("snap-load-1");
console.log("Snapshot restored.");
