import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "字典值",
    prop: "value",
    minWidth: "120",
    transform: (v) => v ?? "-",
  },
  {
    label: "展示文本",
    prop: "label",
    minWidth: "140",
    transform: (v) => v ?? "-",
  },
  {
    label: "字典编码",
    prop: "code",
    minWidth: "180",
  },
  {
    label: "名称",
    prop: "name",
    minWidth: "160",
  },
  {
    label: "作用域",
    prop: "scopeType",
    width: "120",
    align: "center",
  },
  {
    label: "排序",
    prop: "sort",
    width: "80",
    align: "center",
  },
  {
    label: "标记",
    prop: "systemFlag",
    width: "80",
    align: "center",
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
    align: "center",
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: "180",
    transform: (v) => v || "-",
    hide: true,
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    width: "170",
    align: "center",
    hide: true,
  },
  {
    label: "操作",
    width: "260",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
