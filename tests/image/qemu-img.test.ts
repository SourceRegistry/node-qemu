import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QemuImg, _deps } from "../../src/image/qemu-img.js";

const sampleInfoJson = JSON.stringify({
  filename: "/vm.qcow2",
  format: "qcow2",
  "virtual-size": 21474836480,
  "actual-size": 1048576,
  "cluster-size": 65536,
  snapshots: [
    {
      id: "1",
      name: "snap1",
      "vm-state-size": 0,
      "date-sec": 1716000000,
      "date-nsec": 0,
      "vm-clock-sec": 120,
      "vm-clock-nsec": 0,
    },
  ],
});

describe("QemuImg.info", () => {
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFn = vi.fn();
    _deps.execFile = mockFn as typeof _deps.execFile;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses info JSON into ImageInfo", async () => {
    mockFn.mockResolvedValue({ stdout: sampleInfoJson, stderr: "" });
    const info = await QemuImg.info({ filename: "/vm.qcow2" });
    expect(info.format).toBe("qcow2");
    expect(info.virtualSize).toBe(21474836480);
    expect(info.snapshots).toHaveLength(1);
    expect(info.snapshots[0].name).toBe("snap1");
  });

  it("maps actual-size to diskSize", async () => {
    mockFn.mockResolvedValue({ stdout: sampleInfoJson, stderr: "" });
    const info = await QemuImg.info({ filename: "/vm.qcow2" });
    expect(info.diskSize).toBe(1048576);
  });
});

describe("QemuImg.snapshotList", () => {
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFn = vi.fn();
    _deps.execFile = mockFn as typeof _deps.execFile;
  });

  it("returns snapshots from info JSON", async () => {
    mockFn.mockResolvedValue({ stdout: sampleInfoJson, stderr: "" });
    const snaps = await QemuImg.snapshotList({ filename: "/vm.qcow2" });
    expect(snaps).toHaveLength(1);
    expect(snaps[0].id).toBe("1");
    expect(snaps[0].vmStateSize).toBe(0);
  });
});

describe("QemuImg CLI args", () => {
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFn = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    _deps.execFile = mockFn as typeof _deps.execFile;
  });

  function lastArgs(): string[] {
    return (mockFn.mock.calls.at(-1)?.[1] as string[]) ?? [];
  }

  it("create passes -f and backing file flags", async () => {
    await QemuImg.create({ filename: "/vm.qcow2", format: "qcow2", size: "20G", backingFile: "/base.qcow2", backingFormat: "qcow2" });
    const args = lastArgs();
    expect(args).toContain("create");
    expect(args).toContain("-f");
    expect(args).toContain("-b");
    expect(args).toContain("/base.qcow2");
    expect(args).toContain("-F");
    expect(args).toContain("20G");
  });

  it("convert passes -O format and -c compress flag", async () => {
    await QemuImg.convert({ src: "/vm.raw", dst: "/vm.qcow2", format: "qcow2", compress: true });
    const args = lastArgs();
    expect(args).toContain("convert");
    expect(args).toContain("-O");
    expect(args).toContain("-c");
  });

  it("resize passes filename and size", async () => {
    await QemuImg.resize({ filename: "/vm.qcow2", size: "+10G" });
    const args = lastArgs();
    expect(args).toContain("resize");
    expect(args).toContain("/vm.qcow2");
    expect(args).toContain("+10G");
  });

  it("snapshotCreate passes -c tag", async () => {
    await QemuImg.snapshotCreate({ filename: "/vm.qcow2", tag: "snap1" });
    expect(lastArgs()).toContain("-c");
    expect(lastArgs()).toContain("snap1");
  });

  it("snapshotApply passes -a tag", async () => {
    await QemuImg.snapshotApply({ filename: "/vm.qcow2", tag: "snap1" });
    expect(lastArgs()).toContain("-a");
    expect(lastArgs()).toContain("snap1");
  });

  it("snapshotDelete passes -d tag", async () => {
    await QemuImg.snapshotDelete({ filename: "/vm.qcow2", tag: "snap1" });
    expect(lastArgs()).toContain("-d");
    expect(lastArgs()).toContain("snap1");
  });

  it("check passes -r all when repair=true", async () => {
    await QemuImg.check({ filename: "/vm.qcow2", repair: true });
    const args = lastArgs();
    expect(args).toContain("check");
    expect(args).toContain("-r");
    expect(args).toContain("all");
  });
});

describe("QemuImg integration guard", () => {
  const hasQemuImg = (): boolean => {
    try {
      const { execSync } = require("node:child_process") as typeof import("node:child_process");
      execSync("which qemu-img 2>/dev/null");
      return true;
    } catch {
      return false;
    }
  };

  describe.skipIf(!hasQemuImg())("real qemu-img", () => {
    afterEach(() => {
      // restore real execFile
      const { execFile: real } = require("../../src/image/exec.js") as typeof import("../../src/image/exec.js");
      _deps.execFile = real;
    });

    it("info works on a created image", async () => {
      const { execFile: real } = await import("../../src/image/exec.js");
      _deps.execFile = real;
      const { tmpdir } = await import("node:os");
      const { join } = await import("node:path");
      const { rm } = await import("node:fs/promises");
      const file = join(tmpdir(), `test-${Date.now()}.qcow2`);
      try {
        await QemuImg.create({ filename: file, format: "qcow2", size: "1G" });
        const info = await QemuImg.info({ filename: file });
        expect(info.format).toBe("qcow2");
        expect(info.virtualSize).toBe(1_073_741_824);
      } finally {
        await rm(file, { force: true });
      }
    });
  });
});
