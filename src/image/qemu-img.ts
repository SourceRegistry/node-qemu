import { execFile as _execFile } from "./exec.js";
import type { ImageFormat, ImageInfo, Snapshot } from "./types.js";
import { resolveQemuBinary } from "../util/resolve-binary.js";

const QEMU_IMG = resolveQemuBinary("qemu-img");

/** Allows tests to swap out the execFile implementation. */
export const _deps = { execFile: _execFile };

interface RawSnapshotEntry {
  id: string;
  name: string;
  "vm-state-size": number;
  "date-sec": number;
  "date-nsec": number;
  "vm-clock-sec": number;
  "vm-clock-nsec": number;
}

function parseSnapshot(s: RawSnapshotEntry): Snapshot {
  return {
    id: s.id,
    name: s.name,
    vmStateSize: s["vm-state-size"],
    dateSec: s["date-sec"],
    dateNsec: s["date-nsec"],
    vmClockSec: s["vm-clock-sec"],
    vmClockNsec: s["vm-clock-nsec"],
  };
}

/**
 * Typed wrappers around the `qemu-img` CLI.
 * All methods reject if `qemu-img` exits with a non-zero code.
 *
 * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html}
 */
export class QemuImg {
  /**
   * Create a new disk image.
   *
   * @param opts.filename - Output image path.
   * @param opts.format - Image format (default: `raw`).
   * @param opts.size - Size string, e.g. `"20G"`.
   * @param opts.backingFile - Optional backing file path (creates a thin-provisioned overlay).
   * @param opts.backingFormat - Format of the backing file.
   *
   * @example
   * ```ts
   * await QemuImg.create({ filename: "/var/lib/qemu/vm1.qcow2", format: "qcow2", size: "20G" });
   * ```
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-create}
   */
  static async create(opts: {
    filename: string;
    format?: ImageFormat;
    size: string;
    backingFile?: string;
    backingFormat?: ImageFormat;
  }): Promise<void> {
    const args = ["create"];
    if (opts.format) args.push("-f", opts.format);
    if (opts.backingFile) {
      args.push("-b", opts.backingFile);
      if (opts.backingFormat) args.push("-F", opts.backingFormat);
    }
    args.push(opts.filename, opts.size);
    await _deps.execFile(QEMU_IMG, args);
  }

  /**
   * Resize an existing image.
   *
   * @param opts.size - Absolute size (e.g. `"40G"`) or relative delta (e.g. `"+10G"`, `"-5G"`).
   * @param opts.preallocation - Preallocation strategy for the new space.
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-resize}
   */
  static async resize(opts: {
    filename: string;
    size: string;
    format?: ImageFormat;
    preallocation?: "off" | "metadata" | "falloc" | "full";
  }): Promise<void> {
    const args = ["resize"];
    if (opts.format) args.push("-f", opts.format);
    if (opts.preallocation) args.push("--preallocation", opts.preallocation);
    args.push(opts.filename, opts.size);
    await _deps.execFile(QEMU_IMG, args);
  }

  /**
   * Convert an image to a different format or the same format with different options.
   *
   * @param opts.compress - Enable compression (qcow2 only).
   * @param opts.sparse - Detect and skip zero sectors (`-S 0`).
   *
   * @example
   * ```ts
   * await QemuImg.convert({ src: "vm.raw", dst: "vm.qcow2", format: "qcow2", compress: true });
   * ```
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-convert}
   */
  static async convert(opts: {
    src: string;
    dst: string;
    format?: ImageFormat;
    srcFormat?: ImageFormat;
    compress?: boolean;
    sparse?: boolean;
  }): Promise<void> {
    const args = ["convert"];
    if (opts.srcFormat) args.push("-f", opts.srcFormat);
    if (opts.format) args.push("-O", opts.format);
    if (opts.compress) args.push("-c");
    if (opts.sparse) args.push("-S", "0");
    args.push(opts.src, opts.dst);
    await _deps.execFile(QEMU_IMG, args);
  }

  /**
   * Return metadata about an image file: format, virtual size, disk size,
   * cluster size, backing file, and internal snapshots.
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-info}
   */
  static async info(opts: { filename: string }): Promise<ImageInfo> {
    const { stdout } = await _deps.execFile(QEMU_IMG, ["info", "--output=json", opts.filename]);
    const raw = JSON.parse(stdout) as Record<string, unknown>;
    return {
      filename: raw["filename"] as string,
      format: raw["format"] as ImageFormat,
      virtualSize: raw["virtual-size"] as number,
      diskSize: (raw["actual-size"] ?? raw["disk-size"] ?? 0) as number,
      clusterSize: raw["cluster-size"] as number | undefined,
      backingFile: raw["backing-filename"] as string | undefined,
      backingFormat: raw["backing-filename-format"] as ImageFormat | undefined,
      snapshots: ((raw["snapshots"] ?? []) as RawSnapshotEntry[]).map(parseSnapshot),
    };
  }

  /**
   * Check an image for consistency errors. Rejects on integrity failure.
   *
   * @param opts.repair - Attempt to repair errors (`-r all`).
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-check}
   */
  static async check(opts: {
    filename: string;
    format?: ImageFormat;
    repair?: boolean;
  }): Promise<void> {
    const args = ["check"];
    if (opts.format) args.push("-f", opts.format);
    if (opts.repair) args.push("-r", "all");
    args.push(opts.filename);
    await _deps.execFile(QEMU_IMG, args);
  }

  /**
   * Create an internal qcow2 snapshot tagged with `tag`.
   * The VM must be stopped or the snapshot taken via QMP for consistency.
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
   */
  static async snapshotCreate(opts: { filename: string; tag: string }): Promise<void> {
    await _deps.execFile(QEMU_IMG, ["snapshot", "-c", opts.tag, opts.filename]);
  }

  /**
   * Restore an image to the internal snapshot identified by `tag`.
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
   */
  static async snapshotApply(opts: { filename: string; tag: string }): Promise<void> {
    await _deps.execFile(QEMU_IMG, ["snapshot", "-a", opts.tag, opts.filename]);
  }

  /**
   * Delete the internal snapshot identified by `tag`.
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
   */
  static async snapshotDelete(opts: { filename: string; tag: string }): Promise<void> {
    await _deps.execFile(QEMU_IMG, ["snapshot", "-d", opts.tag, opts.filename]);
  }

  /**
   * List all internal snapshots stored in the image.
   *
   * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
   */
  static async snapshotList(opts: { filename: string }): Promise<Snapshot[]> {
    const { stdout } = await _deps.execFile(QEMU_IMG, ["info", "--output=json", opts.filename]);
    const raw = JSON.parse(stdout) as Record<string, unknown>;
    return ((raw["snapshots"] ?? []) as RawSnapshotEntry[]).map(parseSnapshot);
  }
}
