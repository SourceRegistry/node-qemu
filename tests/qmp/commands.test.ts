import { describe, it, expect, vi } from "vitest";
import { QMPCommands } from "../../src/qmp/commands.js";

// Concrete subclass for testing
class TestClient extends QMPCommands {
  readonly calls: Array<{ command: string; args?: Record<string, unknown> }> = [];
  private nextReturn: unknown = {};

  setReturn(val: unknown) { this.nextReturn = val; }

  execute<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    this.calls.push({ command, args });
    return Promise.resolve(this.nextReturn as T);
  }
}

describe("QMPCommands — VM run state", () => {
  it("queryStatus sends query-status", async () => {
    const c = new TestClient();
    await c.queryStatus();
    expect(c.calls[0].command).toBe("query-status");
  });

  it("stop sends stop", async () => {
    const c = new TestClient();
    await c.stop();
    expect(c.calls[0].command).toBe("stop");
  });

  it("cont sends cont", async () => {
    const c = new TestClient();
    await c.cont();
    expect(c.calls[0].command).toBe("cont");
  });

  it("systemReset sends system_reset", async () => {
    const c = new TestClient();
    await c.systemReset();
    expect(c.calls[0].command).toBe("system_reset");
  });

  it("quit sends quit", async () => {
    const c = new TestClient();
    await c.quit();
    expect(c.calls[0].command).toBe("quit");
  });

  it("setAction passes options", async () => {
    const c = new TestClient();
    await c.setAction({ reboot: "shutdown", panic: "pause" });
    expect(c.calls[0].command).toBe("set-action");
    expect(c.calls[0].args).toMatchObject({ reboot: "shutdown", panic: "pause" });
  });
});

describe("QMPCommands — block", () => {
  it("queryBlock sends query-block", async () => {
    const c = new TestClient();
    c.setReturn([]);
    await c.queryBlock();
    expect(c.calls[0].command).toBe("query-block");
  });

  it("blockdevBackup passes all options", async () => {
    const c = new TestClient();
    await c.blockdevBackup({ device: "hd0", target: "backup", sync: "full" });
    expect(c.calls[0].command).toBe("blockdev-backup");
    expect(c.calls[0].args).toMatchObject({ device: "hd0", target: "backup", sync: "full" });
  });

  it("blockJobCancel includes force when provided", async () => {
    const c = new TestClient();
    await c.blockJobCancel("hd0", true);
    expect(c.calls[0].args).toEqual({ device: "hd0", force: true });
  });

  it("transaction sends actions array", async () => {
    const c = new TestClient();
    await c.transaction([{ type: "block-dirty-bitmap-add", data: {} }]);
    expect(c.calls[0].command).toBe("transaction");
    expect(Array.isArray((c.calls[0].args as Record<string, unknown>)?.actions)).toBe(true);
  });
});

describe("QMPCommands — migration", () => {
  it("migrate passes uri", async () => {
    const c = new TestClient();
    await c.migrate({ uri: "tcp:192.168.1.2:4444" });
    expect(c.calls[0].command).toBe("migrate");
    expect(c.calls[0].args).toMatchObject({ uri: "tcp:192.168.1.2:4444" });
  });

  it("migrateSetCapabilities sends capabilities array", async () => {
    const c = new TestClient();
    await c.migrateSetCapabilities([{ capability: "xbzrle", state: true }]);
    expect((c.calls[0].args as Record<string, unknown>)?.capabilities).toHaveLength(1);
  });
});

describe("QMPCommands — QOM", () => {
  it("qomList sends qom-list with path", async () => {
    const c = new TestClient();
    c.setReturn([]);
    await c.qomList("/machine");
    expect(c.calls[0].command).toBe("qom-list");
    expect(c.calls[0].args).toEqual({ path: "/machine" });
  });

  it("qomSet sends qom-set", async () => {
    const c = new TestClient();
    await c.qomSet("/machine/soc", "freq", 3_000_000_000);
    expect(c.calls[0].command).toBe("qom-set");
    expect(c.calls[0].args).toEqual({ path: "/machine/soc", property: "freq", value: 3_000_000_000 });
  });
});

describe("QMPCommands — VM identity", () => {
  it("queryUuid sends query-uuid", async () => {
    const c = new TestClient();
    c.setReturn({ UUID: "550e8400-e29b-41d4-a716-446655440000" });
    const r = await c.queryUuid();
    expect(c.calls[0].command).toBe("query-uuid");
    expect(r.UUID).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("queryName sends query-name", async () => {
    const c = new TestClient();
    c.setReturn({ name: "my-vm" });
    await c.queryName();
    expect(c.calls[0].command).toBe("query-name");
  });
});

describe("QMPCommands — object management", () => {
  it("objectAdd sends qom-type and id", async () => {
    const c = new TestClient();
    await c.objectAdd({ "qom-type": "memory-backend-ram", id: "mem1", props: { size: 1073741824 } });
    expect(c.calls[0].command).toBe("object-add");
    expect(c.calls[0].args).toMatchObject({ "qom-type": "memory-backend-ram", id: "mem1" });
  });

  it("objectDel sends id", async () => {
    const c = new TestClient();
    await c.objectDel("mem1");
    expect(c.calls[0].command).toBe("object-del");
    expect(c.calls[0].args).toEqual({ id: "mem1" });
  });
});

describe("QMPCommands — chardev", () => {
  it("chardevAdd sends chardev-add and returns result", async () => {
    const c = new TestClient();
    c.setReturn({ pty: "/dev/pts/4" });
    const r = await c.chardevAdd({ id: "serial1", backend: { type: "pty", data: {} } });
    expect(c.calls[0].command).toBe("chardev-add");
    expect((r as { pty: string }).pty).toBe("/dev/pts/4");
  });

  it("chardevRemove sends id", async () => {
    const c = new TestClient();
    await c.chardevRemove("serial1");
    expect(c.calls[0].command).toBe("chardev-remove");
    expect(c.calls[0].args).toEqual({ id: "serial1" });
  });
});

describe("QMPCommands — iothreads", () => {
  it("queryIothreads sends query-iothreads", async () => {
    const c = new TestClient();
    c.setReturn([]);
    await c.queryIothreads();
    expect(c.calls[0].command).toBe("query-iothreads");
  });
});

describe("QMPCommands — memory dump", () => {
  it("dumpGuestMemory passes options", async () => {
    const c = new TestClient();
    await c.dumpGuestMemory({ paging: false, protocol: "file:/tmp/dump.elf", detach: true });
    expect(c.calls[0].command).toBe("dump-guest-memory");
    expect(c.calls[0].args).toMatchObject({ paging: false, protocol: "file:/tmp/dump.elf", detach: true });
  });
});

describe("QMPCommands — HMP escape hatch", () => {
  it("humanMonitorCommand sends command-line", async () => {
    const c = new TestClient();
    c.setReturn("PCI devices:\n...");
    const out = await c.humanMonitorCommand("info pci");
    expect(c.calls[0].command).toBe("human-monitor-command");
    expect(c.calls[0].args).toEqual({ "command-line": "info pci" });
    expect(out).toBe("PCI devices:\n...");
  });
});

describe("QMPCommands — typed EventEmitter", () => {
  it("on/off work for typed events", () => {
    const c = new TestClient();
    const spy = vi.fn();
    c.on("SHUTDOWN", spy);
    c.emit("SHUTDOWN", { guest: false, reason: "host-qmp-quit" });
    expect(spy).toHaveBeenCalledWith({ guest: false, reason: "host-qmp-quit" });
    c.off("SHUTDOWN", spy);
    c.emit("SHUTDOWN", { guest: false, reason: "host-qmp-quit" });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("once fires only once", () => {
    const c = new TestClient();
    const spy = vi.fn();
    c.once("STOP", spy);
    c.emit("STOP", {} as Record<string, never>);
    c.emit("STOP", {} as Record<string, never>);
    expect(spy).toHaveBeenCalledOnce();
  });
});
