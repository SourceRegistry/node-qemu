import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Known QEMU installation directories per platform.
 * Checked in order; first match wins.
 */
const QEMU_DIRS: Partial<Record<NodeJS.Platform, string[]>> = {
  win32: [
    "C:\\Program Files\\qemu",
    "C:\\Program Files (x86)\\qemu",
  ],
  linux: [
    "/usr/bin",
    "/usr/local/bin",
    "/usr/local/sbin",
  ],
  darwin: [
    "/opt/homebrew/bin",
    "/usr/local/bin",
  ],
};

/**
 * Resolve a QEMU binary to an absolute path by checking known installation
 * directories. Falls back to the bare name (PATH lookup) if not found.
 *
 * No filesystem search is performed — only known locations are checked.
 *
 * @param name - Binary name without extension, e.g. `"qemu-system-x86_64"` or `"qemu-img"`.
 * @returns Absolute path if found in a known location, otherwise `name` for PATH resolution.
 *
 * @example
 * ```ts
 * const bin = resolveQemuBinary("qemu-system-x86_64");
 * // Windows: "C:\\Program Files\\qemu\\qemu-system-x86_64.exe"
 * // Linux:   "/usr/bin/qemu-system-x86_64"
 * // Fallback: "qemu-system-x86_64"
 * ```
 */
export function resolveQemuBinary(name: string): string {
  const ext = process.platform === "win32" ? ".exe" : "";
  const dirs = QEMU_DIRS[process.platform] ?? [];
  for (const dir of dirs) {
    const full = join(dir, name + ext);
    if (existsSync(full)) return full;
  }
  return name;
}
