import type { TableHeaderRecord } from "@ingot/admin-core";
export const TABLE_ID = "security-iam-authorization-audit";
export const tableHeaders: TableHeaderRecord[] = [
  { label: "时间", prop: "timestamp", minWidth: 180, required: true },
  { label: "操作者", prop: "actor", minWidth: 160 },
  { label: "操作", prop: "changeType", minWidth: 120, required: true },
  { label: "目标", prop: "target", minWidth: 210 },
  { label: "变更摘要", prop: "changeSummary", minWidth: 220 },
];
