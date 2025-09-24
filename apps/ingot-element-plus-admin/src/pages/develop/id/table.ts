import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "业务标签",
    prop: "bizTag",
  },
  {
    label: "当前最大ID",
    prop: "maxId",
  },
  {
    label: "ID步长",
    prop: "step",
  },
  {
    label: "描述",
    prop: "description",
  },
  {
    label: "更新时间",
    prop: "updateTime",
  },
  {
    label: "操作",
    width: "210",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
