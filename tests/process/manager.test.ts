import { describe, it, expect, vi, afterEach } from "vitest";
import { EventEmitter } from "node:events";

vi.mock("node:child_process", () => ({ spawn: vi.fn() }));
vi.mock("node:fs/promises", () => ({ writeFile: vi.fn().mockResolvedValue(undefined), rm: vi.fn().mockResolvedValue(undefined) }));

import { spawn } from "node:child_process";
import { writeFile, rm } from "node:fs/promises";
import { QemuProcess } from "../../src/process/manager.js";

class MockProcess extends EventEmitter {
  pid = 12345;
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  killSignal: string | undefined;

  kill(sig: string) {
    this.killSignal = sig;
    setImmediate(() => this.emit("exit", 0, null));
  }
}

function makeProc() {
  return new QemuProcess({
    binary: "/usr/bin/qemu-system-x86_64",
    config: { machine: { type: "q35" }, memory: { size: 512 } },
  });
}

describe("QemuProcess", () => {
  afterEach(() => { vi.clearAllMocks(); });

  it("pid is undefined before start", () => {
    expect(makeProc().pid).toBeUndefined();
  });

  it("socketPath returns undefined when no qmp configured", () => {
    expect(makeProc().socketPath).toBeUndefined();
  });

  it("socketPath returns path when configured", () => {
    const proc = new QemuProcess({ config: { qmp: { socketPath: "/run/qemu/vm.sock" } } });
    expect(proc.socketPath).toBe("/run/qemu/vm.sock");
  });

  it("start spawns the process and exposes pid", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = makeProc();
    await proc.start();
    expect(proc.pid).toBe(12345);
    expect(spawn).toHaveBeenCalledOnce();
  });

  it("start rejects if called twice", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = makeProc();
    await proc.start();
    await expect(proc.start()).rejects.toThrow("already started");
  });

  it("stop sends SIGTERM then resolves on exit", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = makeProc();
    await proc.start();
    await proc.stop();
    expect(mock.killSignal).toBe("SIGTERM");
  });

  it("kill sends SIGKILL", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = makeProc();
    await proc.start();
    await proc.kill();
    expect(mock.killSignal).toBe("SIGKILL");
  });

  it("emits exit event when process exits", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = makeProc();
    const spy = vi.fn();
    proc.on("exit", spy);
    await proc.start();
    mock.emit("exit", 0, null);
    expect(spy).toHaveBeenCalledWith(0, null);
  });

  it("writes the pidfile itself when not daemonized", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = new QemuProcess({ config: { pidfile: "/run/vm.pid" } });
    await proc.start();
    expect(writeFile).toHaveBeenCalledWith("/run/vm.pid", "12345", "utf8");
  });

  it("deletes the pidfile on exit when not daemonized", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = new QemuProcess({ config: { pidfile: "/run/vm.pid" } });
    await proc.start();
    mock.emit("exit", 0, null);
    expect(rm).toHaveBeenCalledWith("/run/vm.pid", { force: true });
  });

  it("does not touch the pidfile when daemonized, since QEMU itself owns it after forking", async () => {
    const mock = new MockProcess();
    vi.mocked(spawn).mockReturnValue(mock as unknown as ReturnType<typeof spawn>);
    const proc = new QemuProcess({ config: { pidfile: "/run/vm.pid", daemonize: true } });
    await proc.start();
    expect(writeFile).not.toHaveBeenCalled();
    // The wrapper process exiting (code 0) is normal daemonize behavior,
    // not the real daemon dying -- must not delete the daemon's pidfile.
    mock.emit("exit", 0, null);
    expect(rm).not.toHaveBeenCalled();
  });

  it("implements Symbol.asyncDispose", () => {
    expect(typeof makeProc()[Symbol.asyncDispose]).toBe("function");
  });
});
