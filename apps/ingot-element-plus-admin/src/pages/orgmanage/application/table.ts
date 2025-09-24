import type { TableHeaderRecord } from "@/components/table";
export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "应用",
    prop: "menuName",
  },
  {
    label: "默认应用",
    prop: "defaultApp",
  },
  {
    label: "状态",
    prop: "status",
  },
  {
    label: "创建时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    hide: true,
  },
  {
    label: "操作",
    width: "320",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
