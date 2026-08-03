import type { TableHeaderRecord } from "@/components/table";

export const rateLimitTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "编码",
    prop: "code",
    minWidth: "140",
  },
  {
    label: "分组",
    prop: "groupCode",
    minWidth: "120",
  },
  {
    label: "限流维度",
    prop: "dimension",
    width: "100",
    align: "center",
  },
  {
    label: "QPS",
    prop: "qps",
    width: "80",
    align: "center",
  },
  {
    label: "突发",
    prop: "burst",
    width: "80",
    align: "center",
  },
  {
    label: "优先级",
    prop: "priority",
    width: "90",
    align: "center",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
    align: "center",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
    align: "center",
  },
];
