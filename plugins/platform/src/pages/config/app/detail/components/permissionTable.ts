import type { TableHeaderRecord } from "@ingot/admin-core";

export const permissionTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "权限编码",
    prop: "code",
    minWidth: "200",
  },
  {
    label: "名称",
    prop: "name",
    width: "150",
  },
  {
    label: "节点类型",
    prop: "nodeType",
    width: "100",
  },
  {
    label: "托管",
    prop: "managed",
    width: "80",
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
  },
  {
    label: "操作",
    width: "280",
    prop: "actions",
    fixed: "right",
  },
];
