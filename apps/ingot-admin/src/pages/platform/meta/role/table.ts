import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "角色名",
    prop: "name",
  },
  {
    label: "角色编码",
    prop: "code",
    width: "180",
  },
  {
    label: "角色类型",
    prop: "type",
  },
  {
    label: "组织类型",
    prop: "orgType",
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
    label: "操作",
    width: "320",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
