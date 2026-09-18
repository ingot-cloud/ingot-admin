import type { TableHeaderRecord } from "@ingot/admin-core";

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "类型", prop: "changeType", required: true },
  { label: "时间", prop: "timestamp" },
];
