import type { TableHeaderRecord } from "@ingot/admin-core";

export const blockEventTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "Key 类型",
    prop: "keyType",
    width: "110",
  },
  {
    label: "匹配值",
    prop: "keyValue",
    minWidth: "180",
  },
  {
    label: "原因",
    prop: "reason",
    minWidth: "160",
  },
  {
    label: "封禁时间",
    prop: "blockedAt",
    minWidth: "160",
  },
  {
    label: "失效时间",
    prop: "expiresAt",
    minWidth: "160",
  },
  {
    label: "来源",
    prop: "source",
    width: "90",
  },
];
