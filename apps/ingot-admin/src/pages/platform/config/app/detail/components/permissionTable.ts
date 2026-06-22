import type { TableHeaderRecord } from "@/components/table";

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
    align: "center",
  },
  {
    label: "托管",
    prop: "managed",
    width: "80",
    align: "center",
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
    align: "center",
  },
  {
    label: "操作",
    width: "280",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
