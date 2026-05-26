/** Typed QEMU process configuration. */
export type QemuAccel = "kvm" | "hvf" | "xen" | "hax" | "tcg";
export interface QemuMachine {
    type: string;
    accel?: QemuAccel;
    /** Kernel IRQCHIP mode (kernel_irqchip). */
    kernelIrqchip?: "on" | "off" | "split";
}
export interface QemuSmpOptions {
    cpus?: number;
    cores?: number;
    threads?: number;
    sockets?: number;
    maxCpus?: number;
}
export interface QemuMemory {
    /** Size in MiB. */
    size: number;
}
export type DriveFormat = "qcow2" | "qcow" | "raw" | "vmdk" | "vdi" | "vpc" | "vhdx" | "parallels";
export interface QemuDrive {
    file: string;
    format?: DriveFormat;
    id?: string;
    media?: "disk" | "cdrom";
    cache?: "none" | "writeback" | "writethrough" | "unsafe" | "directsync";
    aio?: "native" | "io_uring" | "threads";
    readonly?: boolean;
    discard?: "ignore" | "unmap";
    /** Use virtio-blk-pci device instead of the default IDE. */
    virtio?: boolean;
}
export type QemuNetType = "tap" | "user" | "bridge" | "none";
export interface QemuNetTap {
    type: "tap";
    id?: string;
    ifname?: string;
    script?: string;
    downscript?: string;
    mac?: string;
    vhost?: boolean;
}
export interface QemuNetUser {
    type: "user";
    id?: string;
    hostfwd?: string[];
    mac?: string;
}
export interface QemuNetBridge {
    type: "bridge";
    id?: string;
    br?: string;
    mac?: string;
}
export interface QemuNetNone {
    type: "none";
}
export type QemuNet = QemuNetTap | QemuNetUser | QemuNetBridge | QemuNetNone;
export interface QemuQmpSocket {
    socketPath: string;
}
export interface QemuQmpTcp {
    host: string;
    port: number;
}
export type QemuQmp = QemuQmpSocket | QemuQmpTcp;
export interface QemuVnc {
    display: string;
    password?: boolean;
}
export interface QemuSpice {
    port?: number;
    host?: string;
    password?: string;
    disableTicketing?: boolean;
}
export interface QemuConfig {
    machine?: QemuMachine;
    cpu?: string;
    smp?: number | QemuSmpOptions;
    memory?: QemuMemory;
    drives?: QemuDrive[];
    net?: QemuNet[];
    qmp?: QemuQmp;
    vnc?: QemuVnc;
    spice?: QemuSpice;
    serial?: string;
    monitor?: string;
    pidfile?: string;
    daemonize?: boolean;
    noReboot?: boolean;
    noShutdown?: boolean;
    /** Shorthand to add -enable-kvm. */
    enableKvm?: boolean;
    extraArgs?: string[];
}
export interface QemuProcessOptions {
    /** Path to the QEMU binary. Defaults to `qemu-system-x86_64`. */
    binary?: string;
    config: QemuConfig;
}
//# sourceMappingURL=config.d.ts.map