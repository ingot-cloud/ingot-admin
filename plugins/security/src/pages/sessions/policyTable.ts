import type { TableHeaderRecord } from "@ingot/admin-core";

export const policyTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "生效范围",
    prop: "scope",
    width: "120",
  },
  {
    label: "客户端",
    prop: "clientId",
    minWidth: "120",
  },
  {
    label: "用户类型",
    prop: "userType",
    width: "110",
  },
  {
    label: "最大会话数",
    prop: "maxSessions",
    width: "120",
  },
  {
    label: "超出处置",
    prop: "overflow",
    minWidth: "130",
  },
  {
    label: "管理用户单会话",
    prop: "adminForbidConcurrent",
    width: "130",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: "160",
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    minWidth: "170",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
  },
];
