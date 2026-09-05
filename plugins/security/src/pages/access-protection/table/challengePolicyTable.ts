import type { TableHeaderRecord } from "@ingot/admin-core";

export const challengePolicyTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "编码",
    prop: "code",
    minWidth: "140",
  },
  {
    label: "分组/路径",
    prop: "target",
    minWidth: "160",
  },
  {
    label: "触发",
    prop: "trigger",
    width: "120",
  },
  {
    label: "类型",
    prop: "challengeType",
    width: "100",
  },
  {
    label: "scope",
    prop: "scope",
    minWidth: "120",
  },
  {
    label: "TTL",
    prop: "passTokenTtlSec",
    width: "90",
  },
  {
    label: "剩余次数",
    prop: "passTokenRemaining",
    width: "100",
  },
  {
    label: "优先级",
    prop: "priority",
    width: "90",
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
