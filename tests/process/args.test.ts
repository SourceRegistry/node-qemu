import { describe, it, expect } from "vitest";
import { buildArgs } from "../../src/process/args.js";

describe("buildArgs", () => {
  it("returns empty array for empty config", () => {
    expect(buildArgs({})).toEqual([]);
  });

  it("adds -enable-kvm", () => {
    const args = buildArgs({ enableKvm: true });
    expect(args).toContain("-enable-kvm");
  });

  it("builds machine type without accel", () => {
    const args = buildArgs({ machine: { type: "q35" } });
    const idx = args.indexOf("-machine");
    expect(idx).not.toBe(-1);
    expect(args[idx + 1]).toBe("q35");
  });

  it("builds machine type with accel", () => {
    const args = buildArgs({ machine: { type: "q35", accel: "kvm" } });
    const idx = args.indexOf("-machine");
    expect(args[idx + 1]).toBe("q35,accel=kvm");
  });

  it("builds machine with kernelIrqchip", () => {
    const args = buildArgs({ machine: { type: "q35", accel: "kvm", kernelIrqchip: "split" } });
    const idx = args.indexOf("-machine");
    expect(args[idx + 1]).toBe("q35,accel=kvm,kernel_irqchip=split");
  });

  it("adds -cpu", () => {
    const args = buildArgs({ cpu: "host" });
    expect(args).toContain("-cpu");
    expect(args[args.indexOf("-cpu") + 1]).toBe("host");
  });

  it("adds -smp as number", () => {
    const args = buildArgs({ smp: 4 });
    expect(args).toContain("-smp");
    expect(args[args.indexOf("-smp") + 1]).toBe("4");
  });

  it("adds -smp with topology", () => {
    const args = buildArgs({ smp: { cpus: 4, cores: 2, threads: 2, sockets: 1 } });
    const idx = args.indexOf("-smp");
    expect(args[idx + 1]).toBe("cpus=4,cores=2,threads=2,sockets=1");
  });

  it("adds -m for memory", () => {
    const args = buildArgs({ memory: { size: 2048 } });
    expect(args).toContain("-m");
    expect(args[args.indexOf("-m") + 1]).toBe("2048");
  });

  it("adds -no-reboot and -no-shutdown", () => {
    const args = buildArgs({ noReboot: true, noShutdown: true });
    expect(args).toContain("-no-reboot");
    expect(args).toContain("-no-shutdown");
  });

  it("adds -daemonize", () => {
    const args = buildArgs({ daemonize: true });
    expect(args).toContain("-daemonize");
  });

  it("adds -pidfile", () => {
    const args = buildArgs({ pidfile: "/run/qemu/vm1.pid" });
    expect(args).toContain("-pidfile");
    expect(args[args.indexOf("-pidfile") + 1]).toBe("/run/qemu/vm1.pid");
  });

  it("adds -qmp unix socket", () => {
    const args = buildArgs({ qmp: { socketPath: "/run/qemu/vm1.sock" } });
    const idx = args.indexOf("-qmp");
    expect(idx).not.toBe(-1);
    expect(args[idx + 1]).toMatch(/^unix:\/run\/qemu\/vm1\.sock/);
  });

  it("adds -qmp tcp", () => {
    const args = buildArgs({ qmp: { host: "127.0.0.1", port: 4444 } });
    const idx = args.indexOf("-qmp");
    expect(args[idx + 1]).toMatch(/^tcp:127\.0\.0\.1:4444/);
  });

  it("adds -drive for each drive", () => {
    const args = buildArgs({
      drives: [
        { file: "/var/lib/qemu/vm1.qcow2", format: "qcow2" },
        { file: "/var/lib/qemu/data.raw" },
      ],
    });
    expect(args.filter((a) => a === "-drive")).toHaveLength(2);
  });

  it("encodes drive options", () => {
    const args = buildArgs({
      drives: [
        {
          file: "/vm.qcow2",
          format: "qcow2",
          id: "hd0",
          cache: "none",
          aio: "native",
          readonly: true,
          discard: "unmap",
        },
      ],
    });
    const idx = args.indexOf("-drive");
    expect(args[idx + 1]).toContain("file=/vm.qcow2");
    expect(args[idx + 1]).toContain("format=qcow2");
    expect(args[idx + 1]).toContain("id=hd0");
    expect(args[idx + 1]).toContain("cache=none");
    expect(args[idx + 1]).toContain("aio=native");
    expect(args[idx + 1]).toContain("readonly=on");
    expect(args[idx + 1]).toContain("discard=unmap");
  });

  it("adds if=none for a virtio drive, so the -device attach doesn't fight QEMU's implicit if=ide attach", () => {
    const args = buildArgs({
      drives: [{ file: "/vm.qcow2", format: "qcow2", virtio: true }],
    });
    const idx = args.indexOf("-drive");
    expect(args[idx + 1]).toContain("if=none");
    expect(args).toContain("-device");
    expect(args[args.indexOf("-device") + 1]).toBe("virtio-blk-pci,drive=drive0");
  });

  it("does not add if=none for a non-virtio drive", () => {
    const args = buildArgs({
      drives: [{ file: "/seed.img", format: "raw", media: "cdrom" }],
    });
    const idx = args.indexOf("-drive");
    expect(args[idx + 1]).not.toContain("if=none");
  });

  it("gives each net entry a distinct default id instead of always 'net0'", () => {
    const args = buildArgs({
      net: [
        { type: "tap", ifname: "tap0", script: "no", downscript: "no" },
        { type: "tap", ifname: "tap1", script: "no", downscript: "no" },
        { type: "tap", ifname: "tap2", script: "no", downscript: "no" },
      ],
    });
    const netdevs = args.filter((a) => a.startsWith("tap,id="));
    expect(netdevs).toEqual([
      "tap,id=net0,ifname=tap0,script=no,downscript=no",
      "tap,id=net1,ifname=tap1,script=no,downscript=no",
      "tap,id=net2,ifname=tap2,script=no,downscript=no",
    ]);
    const devices = args.filter((_, i) => args[i - 1] === "-device");
    expect(devices).toEqual([
      "virtio-net-pci,netdev=net0",
      "virtio-net-pci,netdev=net1",
      "virtio-net-pci,netdev=net2",
    ]);
  });

  it("adds tap network", () => {
    const args = buildArgs({
      net: [{ type: "tap", id: "net0", ifname: "tap0", script: "no", downscript: "no" }],
    });
    const idx = args.indexOf("-netdev");
    expect(args[idx + 1]).toContain("tap");
    expect(args[idx + 1]).toContain("ifname=tap0");
    expect(args).toContain("-device");
    expect(args[args.indexOf("-device") + 1]).toContain("virtio-net-pci");
  });

  it("adds user network with hostfwd", () => {
    const args = buildArgs({
      net: [{ type: "user", id: "net0", hostfwd: ["tcp::2222-:22"] }],
    });
    const idx = args.indexOf("-netdev");
    expect(args[idx + 1]).toContain("hostfwd=tcp::2222-:22");
  });

  it("adds -nic none for net type none", () => {
    const args = buildArgs({ net: [{ type: "none" }] });
    expect(args).toContain("-nic");
    expect(args[args.indexOf("-nic") + 1]).toBe("none");
  });

  it("adds -vnc", () => {
    const args = buildArgs({ vnc: { display: ":0" } });
    expect(args).toContain("-vnc");
    expect(args[args.indexOf("-vnc") + 1]).toBe(":0");
  });

  it("adds VNC password flag", () => {
    const args = buildArgs({ vnc: { display: ":0", password: true } });
    expect(args[args.indexOf("-vnc") + 1]).toBe(":0,password=on");
  });

  it("adds -serial and -monitor", () => {
    const args = buildArgs({ serial: "stdio", monitor: "none" });
    expect(args[args.indexOf("-serial") + 1]).toBe("stdio");
    expect(args[args.indexOf("-monitor") + 1]).toBe("none");
  });

  it("adds -accel for each entry with tuning options", () => {
    const args = buildArgs({
      accel: [
        { accel: "kvm", thread: "multi", dirtyRingSize: 4096, notifyVmexit: "run" },
        { accel: "tcg" },
      ],
    });
    const accels = args.filter((a) => a === "-accel");
    expect(accels).toHaveLength(2);
    expect(args[args.indexOf("-accel") + 1]).toBe(
      "kvm,thread=multi,dirty-ring-size=4096,notify-vmexit=run",
    );
    expect(args[args.lastIndexOf("-accel") + 1]).toBe("tcg");
  });

  it("adds -object for each configured QOM object with props", () => {
    const args = buildArgs({
      objects: [{ type: "sev-guest", id: "sev0", props: { "cbitpos": 51, "reduced-phys-bits": 1 } }],
    });
    const idx = args.indexOf("-object");
    expect(args[idx + 1]).toBe("sev-guest,id=sev0,cbitpos=51,reduced-phys-bits=1");
  });

  it("appends extraArgs verbatim", () => {
    const args = buildArgs({ extraArgs: ["-nographic", "-S"] });
    expect(args).toContain("-nographic");
    expect(args).toContain("-S");
  });

  it("builds a full production-style config", () => {
    const args = buildArgs({
      enableKvm: true,
      machine: { type: "q35", accel: "kvm" },
      cpu: "host",
      smp: { cpus: 4, cores: 2, threads: 2 },
      memory: { size: 4096 },
      drives: [{ file: "/vm.qcow2", format: "qcow2", cache: "none", aio: "native" }],
      net: [{ type: "tap", id: "net0", ifname: "tap0", script: "no", downscript: "no" }],
      qmp: { socketPath: "/run/qemu/vm1.sock" },
      vnc: { display: ":0" },
      noReboot: true,
      noShutdown: true,
    });
    expect(args).toContain("-enable-kvm");
    expect(args).toContain("-machine");
    expect(args).toContain("-qmp");
    expect(args).toContain("-drive");
    expect(args).toContain("-netdev");
  });
});
