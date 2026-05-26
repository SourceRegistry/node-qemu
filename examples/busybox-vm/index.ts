/**
 * BusyBox VM example: download Alpine Linux (a minimal BusyBox-based distro),
 * boot it under QEMU, watch serial output, and control it via QMP.
 *
 * Alpine Linux "virt" variant boots entirely from the ISO with no install
 * needed and uses the serial console by default — ideal for headless QEMU.
 *
 * On Windows use WHPX acceleration (Windows Hypervisor Platform must be
 * enabled). Swap accel to "tcg" for a slower but universal fallback.
 *
 * Run:
 *   npx tsx examples/busybox-vm/index.ts
 */

import { join } from "node:path";
import { existsSync, createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { QemuProcess, QMPClient, QemuImg } from "../../src/index.js";

// ── Paths ─────────────────────────────────────────────────────────────────────

const TMP  = join(import.meta.dirname, "../../tmp");
const ISO  = join(TMP, "alpine-virt.iso");
const DISK = join(TMP, "busybox-vm.qcow2");

const QMP_PORT    = 4450;
const ALPINE_URL  =
  "https://dl-cdn.alpinelinux.org/alpine/v3.21/releases/x86_64/alpine-virt-3.21.0-x86_64.iso";

// ── Download helper ───────────────────────────────────────────────────────────

async function downloadWithProgress(url: string, dest: string): Promise<void> {
  if (existsSync(dest)) {
    console.log("ISO already cached:", dest);
    return;
  }

  console.log("Downloading Alpine Linux virt ISO (~50 MB) ...");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const total = Number(res.headers.get("content-length") ?? 0);
  let received = 0;
  let lastPct = -1;

  const progress = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      received += chunk.byteLength;
      if (total) {
        const pct = Math.floor((received / total) * 100);
        if (pct !== lastPct && pct % 10 === 0) {
          process.stdout.write(`\r  ${pct}%`);
          lastPct = pct;
        }
      }
      ctrl.enqueue(chunk);
    },
    flush() { process.stdout.write("\r  100%\n"); },
  });

  await pipeline(
    Readable.fromWeb(res.body!.pipeThrough(progress) as ReadableStream),
    createWriteStream(dest),
  );
  console.log("Download complete.");
}

// ── Setup ─────────────────────────────────────────────────────────────────────

await mkdir(TMP, { recursive: true });
await downloadWithProgress(ALPINE_URL, ISO);

// Fresh disk every run so Alpine always boots clean
if (existsSync(DISK)) {
  const { unlink } = await import("node:fs/promises");
  await unlink(DISK);
}
await QemuImg.create({ filename: DISK, format: "qcow2", size: "2G" });
console.log("Disk image ready:", DISK);

// ── Boot ──────────────────────────────────────────────────────────────────────

const proc = new QemuProcess({
  config: {
    machine: { type: "q35", accel: "whpx" },
    memory: { size: 512 },
    drives: [
      { file: DISK, format: "qcow2", cache: "writeback" },
      { file: ISO,  format: "raw",   media: "cdrom", readonly: true },
    ],
    net: [{ type: "user", id: "net0", hostfwd: ["tcp::2222-:22"] }],
    qmp: { host: "127.0.0.1", port: QMP_PORT },
    extraArgs: [
      "-nographic",         // redirect display → serial → stdout
      "-boot", "order=d",   // boot from CD-ROM first
    ],
  },
});

// Serial console → our stdout
proc.on("stdout", (data) => process.stdout.write(data));

// Filter QEMU warnings, surface real errors
proc.on("stderr", (line) => {
  if (!line.includes("warning:")) process.stderr.write(line);
});

proc.on("exit", (code, signal) => console.log("\nQEMU exited:", { code, signal }));

// Ctrl+C → clean shutdown
process.on("SIGINT", async () => {
  console.log("\nCaught SIGINT — shutting down VM ...");
  try { await client.quit(); } catch { /* already gone */ }
  await proc.stop(5_000);
  process.exit(0);
});

await proc.start();
console.log("QEMU started, PID:", proc.pid);

// ── QMP ───────────────────────────────────────────────────────────────────────

// Give QEMU time to bind the QMP port
await new Promise((r) => setTimeout(r, 1_500));

const client = new QMPClient({ host: "127.0.0.1", port: QMP_PORT });
await client.connect();
console.log("QMP connected\n");

// Typed event handlers
client.on("SHUTDOWN",        (e) => console.log("\n[QMP] SHUTDOWN reason:", e.reason));
client.on("RESET",           (e) => console.log("\n[QMP] RESET guest:", e.guest));
client.on("GUEST_PANICKED",  (e) => console.error("\n[QMP] GUEST PANIC:", e));
client.on("BLOCK_IO_ERROR",  (e) => console.error("\n[QMP] BLOCK I/O ERROR:", e));
client.on("rawEvent",        (e) => {
  if (e.event === "STOP" || e.event === "RESUME")
    console.log(`\n[QMP] ${e.event} at ${e.timestamp.seconds}.${e.timestamp.microseconds}`);
});

const status = await client.queryStatus();
console.log("[QMP] initial status:", status.status);

const version = await client.queryVersion();
console.log("[QMP] QEMU version:", `${version.qemu.major}.${version.qemu.minor}.${version.qemu.micro}`);

// ── Let Alpine boot and stay alive ────────────────────────────────────────────

console.log(
  "\n─────────────────────────────────────────────────",
  "\nAlpine Linux is booting. Serial console above.",
  "\nPress Ctrl+C to shut down.",
  "\n─────────────────────────────────────────────────\n",
);

// Keep the process alive until the VM exits or Ctrl+C
await new Promise<void>((resolve) => {
  proc.once("exit", resolve);
});
