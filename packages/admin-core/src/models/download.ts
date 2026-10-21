import { newEnumExt } from "./common";

/** 「我的下载」页面路径，导出提示与顶栏入口共用。 */
export const DOWNLOAD_CENTER_PATH = "/downloads";

/** 「我的下载」页面标题。 */
export const DOWNLOAD_CENTER_TITLE = "我的下载";

/** 下载任务状态，与后端 DownloadTaskStatus 字面量一致。 */
export enum DownloadTaskStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export const DownloadTaskStatusEnumExtArray = [
  newEnumExt(DownloadTaskStatus.PENDING, "排队中", "info"),
  newEnumExt(DownloadTaskStatus.RUNNING, "生成中", "primary"),
  newEnumExt(DownloadTaskStatus.SUCCEEDED, "可下载", "success"),
  newEnumExt(DownloadTaskStatus.FAILED, "失败", "danger"),
  newEnumExt(DownloadTaskStatus.EXPIRED, "已过期", "info"),
];

/** 任务仍在排队或生成，列表需要继续轮询。 */
export function isDownloadTaskActive(status: DownloadTaskStatus): boolean {
  return status === DownloadTaskStatus.PENDING || status === DownloadTaskStatus.RUNNING;
}

/** 「我的下载」中的一条导出任务；时间为 UTC ISO-8601。 */
export interface DownloadTask {
  id: string;
  source: string;
  title: string;
  status: DownloadTaskStatus;
  filename?: string;
  fileSize?: number;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

/** 短时签名下载链接。 */
export interface DownloadLink {
  url: string;
  filename: string;
  expiresAt: string;
}

/** 后端分页响应；total 可能按字符串序列化。 */
export interface DownloadTaskPage {
  items: DownloadTask[];
  total: number | string;
  page: number;
  pageSize: number;
}
