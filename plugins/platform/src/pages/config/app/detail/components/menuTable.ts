import type { TableHeaderRecord } from "@ingot/admin-core";

export const menuTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "图标",
    prop: "menuType",
    minWidth: "80",
  },
  {
    label: "菜单名称",
    prop: "name",
    minWidth: "200",
  },
  {
    label: "路由",
    prop: "path",
  },
  {
    label: "权限",
    prop: "accessMode",
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
  },
  {
    label: "备注",
    prop: "remark",
  },
  {
    label: "操作",
    width: "280",
    prop: "actions",
    fixed: "right",
  },
];
