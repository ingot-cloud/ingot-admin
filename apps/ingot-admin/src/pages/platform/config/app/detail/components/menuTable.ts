import type { TableHeaderRecord } from "@/components/table";

export const menuTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "图标",
    prop: "menuType",
    align: "center",
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
    align: "center",
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
    align: "center",
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
    align: "center",
  },
];
