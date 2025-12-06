import type { TableHeaderRecord } from "@/components/table";
export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "权限",
    prop: "code",
  },
  {
    label: "名称",
    prop: "name",
    width: "150",
  },
  {
    label: "类型",
    prop: "type",
    width: "100",
  },
  {
    label: "状态",
    prop: "status",
    width: "100",
    align: "center",
  },
  {
    label: "操作",
    width: "320",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
