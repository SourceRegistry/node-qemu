import type { QemuConfig, QemuNet } from "./config.js";

/**
 * Convert a {@link QemuConfig} into a QEMU argv array.
 * Pure function — no side effects, easily testable.
 */
export function buildArgs(config: QemuConfig): string[] {
  const args: string[] = [];

  if (config.enableKvm) args.push("-enable-kvm");

  if (config.machine) {
    let m = config.machine.type;
    if (config.machine.accel) m += `,accel=${config.machine.accel}`;
    if (config.machine.kernelIrqchip) m += `,kernel_irqchip=${config.machine.kernelIrqchip}`;
    args.push("-machine", m);
  }

  if (config.cpu) args.push("-cpu", config.cpu);

  if (config.smp != null) {
    if (typeof config.smp === "number") {
      args.push("-smp", String(config.smp));
    } else {
      const parts: string[] = [];
      if (config.smp.cpus != null) parts.push(`cpus=${config.smp.cpus}`);
      if (config.smp.cores != null) parts.push(`cores=${config.smp.cores}`);
      if (config.smp.threads != null) parts.push(`threads=${config.smp.threads}`);
      if (config.smp.sockets != null) parts.push(`sockets=${config.smp.sockets}`);
      if (config.smp.maxCpus != null) parts.push(`maxcpus=${config.smp.maxCpus}`);
      if (parts.length > 0) args.push("-smp", parts.join(","));
    }
  }

  if (config.memory) args.push("-m", String(config.memory.size));

  if (config.noReboot) args.push("-no-reboot");
  if (config.noShutdown) args.push("-no-shutdown");

  if (config.daemonize) args.push("-daemonize");

  if (config.pidfile) args.push("-pidfile", config.pidfile);

  if (config.qmp) {
    const qmp =
      "socketPath" in config.qmp
        ? `unix:${config.qmp.socketPath},server=on,wait=off`
        : `tcp:${config.qmp.host}:${config.qmp.port},server=on,wait=off`;
    args.push("-qmp", qmp);
  }

  (config.drives ?? []).forEach((drive, i) => {
    const id = drive.id ?? (drive.virtio ? `drive${i}` : undefined);
    const parts: string[] = [];
    // A virtio drive is attached to its virtio-blk-pci device by the
    // separate -device clause below. Without if=none, QEMU's legacy
    // "-drive without if= defaults to if=ide" behavior auto-attaches it
    // to an IDE device too, and the drive ends up attached twice: QEMU
    // rejects the second (virtio-blk-pci) attach with "Drive 'driveN' is
    // already in use ... did you need 'if=none'?".
    if (drive.virtio) parts.push("if=none");
    parts.push(`file=${drive.file}`, `format=${drive.format ?? "raw"}`);
    if (id) parts.push(`id=${id}`);
    if (drive.media) parts.push(`media=${drive.media}`);
    if (drive.cache) parts.push(`cache=${drive.cache}`);
    if (drive.aio) parts.push(`aio=${drive.aio}`);
    if (drive.readonly) parts.push("readonly=on");
    if (drive.discard) parts.push(`discard=${drive.discard}`);
    args.push("-drive", parts.join(","));
    if (drive.virtio) args.push("-device", `virtio-blk-pci,drive=${id}`);
  });

  (config.net ?? []).forEach((net, i) => appendNet(args, net, i));

  if (config.vnc) {
    let v = config.vnc.display;
    if (config.vnc.password) v += ",password=on";
    if (config.vnc.websocket != null) v += `,websocket=${config.vnc.websocket}`;
    args.push("-vnc", v);
  }

  if (config.spice) {
    const parts: string[] = [];
    if (config.spice.port != null) parts.push(`port=${config.spice.port}`);
    if (config.spice.host) parts.push(`addr=${config.spice.host}`);
    if (config.spice.password) parts.push(`password=${config.spice.password}`);
    if (config.spice.disableTicketing) parts.push("disable-ticketing=on");
    if (parts.length > 0) args.push("-spice", parts.join(","));
  }

  if (config.serial) args.push("-serial", config.serial);
  if (config.monitor) args.push("-monitor", config.monitor);

  if (config.extraArgs) args.push(...config.extraArgs);

  return args;
}

function appendNet(args: string[], net: QemuNet, index: number): void {
  if (net.type === "none") {
    args.push("-nic", "none");
    return;
  }

  // Every net entry defaulted to the literal "net0" regardless of
  // position, unlike drives' per-index default id -- multiple net
  // entries without an explicit id collided with "Duplicate ID 'net0'
  // for netdev".
  const id = net.id ?? `net${index}`;

  if (net.type === "tap") {
    const parts = [`tap`, `id=${id}`];
    if (net.ifname) parts.push(`ifname=${net.ifname}`);
    if (net.script) parts.push(`script=${net.script}`);
    if (net.downscript) parts.push(`downscript=${net.downscript}`);
    if (net.vhost) parts.push("vhost=on");
    args.push("-netdev", parts.join(","));
  } else if (net.type === "user") {
    const parts = [`user`, `id=${id}`];
    for (const fwd of net.hostfwd ?? []) parts.push(`hostfwd=${fwd}`);
    args.push("-netdev", parts.join(","));
  } else if (net.type === "bridge") {
    const parts = [`bridge`, `id=${id}`];
    if (net.br) parts.push(`br=${net.br}`);
    args.push("-netdev", parts.join(","));
  }

  const mac = "mac" in net && net.mac ? `,mac=${net.mac}` : "";
  args.push("-device", `virtio-net-pci,netdev=${id}${mac}`);
}
