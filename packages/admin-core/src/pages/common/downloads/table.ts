import type { TableHeaderRecord } from "@/components/table/types";
import { formatDateTime } from "@ingot/shared";

const BYTE_UNITS = ["B", "KB", "MB", "GB"];
const BYTE_STEP = 1024;

export function formatFileSize(size?: number | null): string {
  if (size === undefined || size === null || size < 0) {
    return "-";
  }
  let value = size;
  let unit = 0;
  while (value >= BYTE_STEP && unit < BYTE_UNITS.length - 1) {
    value /= BYTE_STEP;
    unit += 1;
  }
  return unit === 0 ? `${value} ${BYTE_UNITS[0]}` : `${value.toFixed(1)} ${BYTE_UNITS[unit]}`;
}

const formatTime = (value?: string): string => formatDateTime(value);

export const downloadTableHeaders: Array<TableHeaderRecord> = [
  { label: "文件", prop: "filename", minWidth: "220" },
  { label: "来源", prop: "title", minWidth: "120" },
  { label: "状态", prop: "status", width: "110" },
  { label: "大小", prop: "fileSize", width: "100", transform: formatFileSize },
  { label: "创建时间", prop: "createdAt", minWidth: "170", transform: formatTime },
  { label: "过期时间", prop: "expiresAt", minWidth: "170", transform: formatTime },
  { label: "操作", prop: "actions", width: "100", fixed: "right" },
];
