import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名称",
    prop: "name",
  },
  {
    label: "编码",
    prop: "code",
  },
  {
    label: "logo",
    prop: "avatar",
    hide: true,
  },
  {
    label: "状态",
    prop: "status",
  },
  {
    label: "周期",
    prop: "startAt",
  },
  {
    label: "创建时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "操作",
    width: "210",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
