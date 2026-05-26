/**
 * Live migration example: migrate a running VM to a destination host.
 * Source VM must have a running QEMU instance at /tmp/qemu-src.sock.
 * Destination must be listening: qemu-system-x86_64 -incoming tcp:0:4455 ...
 */
import { QMPClient } from "../../src/index.js";

const SRC_SOCK = "/tmp/qemu-src.sock";
const DST_URI = "tcp:192.168.1.10:4455";

await using src = new QMPClient({ socketPath: SRC_SOCK });
await src.connect();
console.log("Connected to source QMP");

// Enable postcopy for minimal downtime
await src.migrateSetCapabilities([
  { capability: "postcopy-ram", state: true },
  { capability: "auto-converge", state: true },
]);

await src.migrateSetParameters({ "max-bandwidth": 1_000_000_000 });

console.log(`Migrating to ${DST_URI}...`);
await src.migrate({ uri: DST_URI });

// Poll migration status
let done = false;
while (!done) {
  await new Promise((r) => setTimeout(r, 500));
  const info = await src.queryMigrate();
  console.log("Migration status:", info.status, info.ram ? `| RAM: ${info.ram.mbps.toFixed(1)} Mbps` : "");
  switch (info.status) {
    case "completed":
      console.log(`Migration complete. Downtime: ${info.downtime ?? "?"}ms`);
      done = true;
      break;
    case "failed":
      throw new Error(`Migration failed: ${info["error-desc"] ?? "unknown"}`);
    case "cancelled":
      throw new Error("Migration cancelled");
  }
}
