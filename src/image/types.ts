export type ImageFormat =
  | "qcow2"
  | "qcow"
  | "raw"
  | "vmdk"
  | "vdi"
  | "vpc"
  | "vhdx"
  | "parallels"
  | "nbd"
  | "rbd"
  | "sheepdog"
  | "ssh"
  | "luks";

export interface Snapshot {
  id: string;
  name: string;
  vmStateSize: number;
  dateSec: number;
  dateNsec: number;
  vmClockSec: number;
  vmClockNsec: number;
}

export interface ImageInfo {
  filename: string;
  format: ImageFormat;
  /** Virtual (provisioned) size in bytes. */
  virtualSize: number;
  /** Actual on-disk size in bytes. */
  diskSize: number;
  clusterSize?: number;
  backingFile?: string;
  backingFormat?: ImageFormat;
  snapshots: Snapshot[];
}
