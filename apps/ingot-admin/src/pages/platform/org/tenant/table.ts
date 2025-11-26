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
    label: "组织类型",
    prop: "orgType",
  },
  {
    label: "状态",
    prop: "status",
  },
  {
    label: "到期时间",
    prop: "endAt",
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
