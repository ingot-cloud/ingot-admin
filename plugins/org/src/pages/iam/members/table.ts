import type { TableHeaderRecord } from "@ingot/admin-core";

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "displayName", required: true },
  { label: "状态", prop: "status" },
];
