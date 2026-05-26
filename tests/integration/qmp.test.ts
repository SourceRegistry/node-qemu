/**
 * Integration tests — require a real QEMU process.
 *
 * Skipped automatically when QEMU is not available.
 * Run manually with a pre-started QEMU or let the suite spawn one.
 *
 * Start QEMU manually:
 *   qemu-system-x86_64 -machine none -nodefaults -nographic \
 *     -qmp tcp:127.0.0.1:4445,server=on,wait=off
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess, execFileSync } from "node:child_process";
import { QMPClient } from "../../src/qmp/client.js";
import { resolveQemuBinary } from "../../src/util/resolve-binary.js";

const QEMU_HOST = "127.0.0.1";
const QEMU_PORT = 4446; // dedicated port so it never clashes with a manual instance

function findQemu(): string | null {
  const bin = resolveQemuBinary("qemu-system-x86_64");
  try {
    execFileSync(bin, ["--version"], { stdio: "ignore" });
    return bin;
  } catch {
    return null;
  }
}

const QEMU_BIN = findQemu();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe.skipIf(!QEMU_BIN)("QMPClient integration", () => {
  let proc: ChildProcess;
  let client: QMPClient;

  beforeAll(async () => {
    proc = spawn(QEMU_BIN!, [
      "-machine", "none",
      "-nodefaults",
      "-nographic",
      "-qmp", `tcp:${QEMU_HOST}:${QEMU_PORT},server=on,wait=off`,
    ], { stdio: "ignore" });

    // Wait for QEMU to bind
    await sleep(800);

    client = new QMPClient({ host: QEMU_HOST, port: QEMU_PORT });
    await client.connect();
  });

  afterAll(async () => {
    try { await client.quit(); } catch { /* already dead */ }
    await client.close();
    proc.kill();
    await sleep(200);
  });

  it("connects and receives connected event", () => {
    // If beforeAll completed without throwing, connect succeeded
    expect(client).toBeDefined();
  });

  it("queryVersion returns QEMU version info", async () => {
    const v = await client.queryVersion();
    expect(typeof v.qemu.major).toBe("number");
    expect(v.qemu.major).toBeGreaterThanOrEqual(7);
  });

  it("queryStatus returns run state", async () => {
    const s = await client.queryStatus();
    expect(typeof s.running).toBe("boolean");
    expect(typeof s.status).toBe("string");
  });

  it("queryCommands returns non-empty command list", async () => {
    const cmds = await client.queryCommands();
    expect(Array.isArray(cmds)).toBe(true);
    expect(cmds.length).toBeGreaterThan(0);
    expect(cmds.some((c) => c.name === "query-status")).toBe(true);
  });

  it("queryName returns name object", async () => {
    const n = await client.queryName();
    expect(typeof n).toBe("object");
  });

  it("queryUuid returns UUID object", async () => {
    const u = await client.queryUuid();
    expect(typeof u.UUID).toBe("string");
    expect(u.UUID.length).toBeGreaterThan(0);
  });

  it("queryKvm returns kvm info", async () => {
    const kvm = await client.queryKvm();
    expect(typeof kvm.enabled).toBe("boolean");
    expect(typeof kvm.present).toBe("boolean");
  });

  it("humanMonitorCommand returns string output", async () => {
    const out = await client.humanMonitorCommand("info version");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("queryBlock returns array", async () => {
    const blocks = await client.queryBlock();
    expect(Array.isArray(blocks)).toBe(true);
  });

  it("queryMemorySizeSummary returns memory info", async () => {
    const mem = await client.queryMemorySizeSummary();
    expect(typeof mem["base-memory"]).toBe("number");
  });

  it("rawEvent fires on STOP/RESUME cycle", async () => {
    const events: string[] = [];
    client.on("rawEvent", (e) => events.push(e.event));

    await client.stop();
    await client.cont();

    // Give async events time to arrive
    await sleep(100);

    expect(events).toContain("STOP");
    expect(events).toContain("RESUME");

    client.removeAllListeners("rawEvent");
  });

  it("stop and cont work", async () => {
    await client.stop();
    const paused = await client.queryStatus();
    expect(paused.running).toBe(false);

    await client.cont();
    const running = await client.queryStatus();
    expect(running.running).toBe(true);
  });
});
