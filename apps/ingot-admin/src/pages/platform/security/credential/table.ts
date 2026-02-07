import type { TableHeaderRecord } from "@/components/table";
export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "配置类型",
    prop: "policyType",
    width: "120",
  },
  {
    label: "配置内容",
    prop: "policyConfig",
  },
  {
    label: "优先级",
    prop: "priority",
    width: "80",
  },
  {
    label: "是否启用",
    prop: "enabled",
    width: "80",
  },
  {
    label: "创建时间",
    prop: "createdAt",
    width: "180",
    hide: true,
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    width: "180",
    hide: true,
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
