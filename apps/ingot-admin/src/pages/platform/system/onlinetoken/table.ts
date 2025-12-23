import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    type: "expand",
    prop: "expand",
  },
  {
    label: "用户",
    prop: "avatar",
  },
  {
    label: "组织",
    prop: "tenantName",
    width: "180",
  },
  {
    label: "客户端",
    prop: "clientName",
  },
  {
    label: "操作",
    width: "100",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
