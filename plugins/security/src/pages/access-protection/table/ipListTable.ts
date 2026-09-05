import type { TableHeaderRecord } from "@ingot/admin-core";

export const ipListTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名单类型",
    prop: "listType",
    width: "100",
  },
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
    minWidth: "140",
  },
  {
    label: "来源",
    prop: "source",
    width: "90",
  },
  {
    label: "生效时间",
    prop: "effectiveAt",
    minWidth: "160",
  },
  {
    label: "失效时间",
    prop: "expiresAt",
    minWidth: "160",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
  },
];
