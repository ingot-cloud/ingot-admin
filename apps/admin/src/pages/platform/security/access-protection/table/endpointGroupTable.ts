import type { TableHeaderRecord } from "@ingot/admin-core";

export const endpointGroupTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "编码",
    prop: "code",
    minWidth: "140",
  },
  {
    label: "名称",
    prop: "name",
    minWidth: "140",
  },
  {
    label: "路径规则",
    prop: "patternList",
    minWidth: "180",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
    align: "center",
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: "160",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
    align: "center",
  },
];
