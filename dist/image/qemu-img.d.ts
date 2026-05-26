import { ImageFormat, ImageInfo, Snapshot } from './types.js';
/** Allows tests to swap out the execFile implementation. */
export declare const _deps: {
    execFile: typeof import("node:child_process").execFile.__promisify__;
};
/**
 * Typed wrappers around the `qemu-img` CLI.
 * All methods reject if `qemu-img` exits with a non-zero code.
 *
 * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html}
 */
export declare class QemuImg {
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
    static create(opts: {
        filename: string;
        format?: ImageFormat;
        size: string;
        backingFile?: string;
        backingFormat?: ImageFormat;
    }): Promise<void>;
    /**
     * Resize an existing image.
     *
     * @param opts.size - Absolute size (e.g. `"40G"`) or relative delta (e.g. `"+10G"`, `"-5G"`).
     * @param opts.preallocation - Preallocation strategy for the new space.
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-resize}
     */
    static resize(opts: {
        filename: string;
        size: string;
        format?: ImageFormat;
        preallocation?: "off" | "metadata" | "falloc" | "full";
    }): Promise<void>;
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
    static convert(opts: {
        src: string;
        dst: string;
        format?: ImageFormat;
        srcFormat?: ImageFormat;
        compress?: boolean;
        sparse?: boolean;
    }): Promise<void>;
    /**
     * Return metadata about an image file: format, virtual size, disk size,
     * cluster size, backing file, and internal snapshots.
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-info}
     */
    static info(opts: {
        filename: string;
    }): Promise<ImageInfo>;
    /**
     * Check an image for consistency errors. Rejects on integrity failure.
     *
     * @param opts.repair - Attempt to repair errors (`-r all`).
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-check}
     */
    static check(opts: {
        filename: string;
        format?: ImageFormat;
        repair?: boolean;
    }): Promise<void>;
    /**
     * Create an internal qcow2 snapshot tagged with `tag`.
     * The VM must be stopped or the snapshot taken via QMP for consistency.
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
     */
    static snapshotCreate(opts: {
        filename: string;
        tag: string;
    }): Promise<void>;
    /**
     * Restore an image to the internal snapshot identified by `tag`.
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
     */
    static snapshotApply(opts: {
        filename: string;
        tag: string;
    }): Promise<void>;
    /**
     * Delete the internal snapshot identified by `tag`.
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
     */
    static snapshotDelete(opts: {
        filename: string;
        tag: string;
    }): Promise<void>;
    /**
     * List all internal snapshots stored in the image.
     *
     * @see {@link https://www.qemu.org/docs/master/tools/qemu-img.html#cmdoption-qemu-img-commands-arg-snapshot}
     */
    static snapshotList(opts: {
        filename: string;
    }): Promise<Snapshot[]>;
}
//# sourceMappingURL=qemu-img.d.ts.map