/**
 * Incremental backup example using dirty bitmaps.
 * Assumes a running VM at /tmp/qemu-backup.sock with a drive node "hd0".
 */
import { QMPClient } from "../../src/index.js";

const SOCK = "/tmp/qemu-backup.sock";
const BITMAP = "incremental-backup";
const NODE = "hd0";

await using client = new QMPClient({ socketPath: SOCK });
await client.connect();
console.log("Connected");

// First run: add a persistent dirty bitmap
try {
  await client.blockDirtyBitmapAdd({
    node: NODE,
    name: BITMAP,
    persistent: true,
  });
  console.log("Bitmap created:", BITMAP);
} catch {
  console.log("Bitmap already exists, reusing");
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupTarget = `/tmp/backup-${timestamp}.qcow2`;

console.log(`Starting incremental backup → ${backupTarget}`);
await client.blockdevBackup({
  device: NODE,
  target: backupTarget,
  sync: "incremental",
  "job-id": `backup-${timestamp}`,
  bitmap: BITMAP,
  "bitmap-mode": "on-success",
  compress: true,
  "auto-finalize": true,
  "auto-dismiss": false,
});

// Wait for backup job to complete
await new Promise<void>((resolve, reject) => {
  client.on("BLOCK_JOB_COMPLETED", (ev) => {
    console.log("Backup completed. Bytes:", ev.len);
    if (ev.error) reject(new Error(ev.error));
    else resolve();
  });
  client.on("BLOCK_JOB_CANCELLED", () => reject(new Error("Backup cancelled")));
});

await client.jobDismiss(`backup-${timestamp}`);
console.log("Done. Backup at:", backupTarget);
