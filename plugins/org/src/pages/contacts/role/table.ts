import type { TableHeaderRecord } from "@ingot/admin-core";
export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名称",
    prop: "avatar",
  },
  {
    label: "手机号",
    prop: "phone",
  },
  {
    label: "email",
    prop: "email",
    transform: (v) => v || "-",
  },
  {
    label: "操作",
    width: "100",
    prop: "actions",
    fixed: "right",
  },
];
