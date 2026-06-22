import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "应用名称",
    prop: "name",
    minWidth: "180",
  },
  {
    label: "应用编码",
    prop: "code",
    width: "180",
  },
  {
    label: "类型",
    prop: "appType",
    width: "100",
    align: "center",
  },
  {
    label: "排序",
    prop: "sort",
    width: "80",
    align: "center",
  },
  {
    label: "状态",
    prop: "status",
    width: "100",
    align: "center",
  },
  {
    label: "应用描述",
    prop: "intro",
    minWidth: "180",
    transform: (v) => v || "-",
  },
  {
    label: "操作",
    width: "260",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
