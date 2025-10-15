import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "部门名称",
    prop: "name",
  },
  {
    label: "主管",
    prop: "managerUsers",
  },
  {
    label: "部门人数",
    prop: "memberCount",
  },
  {
    label: "状态",
    prop: "status",
  },
  {
    label: "操作",
    width: "280",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
