import type { TableHeaderRecord } from "@/components/table";
import { useSocialTypeEnumsEnum } from "@/models/enums";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "序号",
    type: "index",
    align: "center",
    width: "80",
  },
  {
    label: "App ID",
    prop: "appId",
  },
  {
    label: "App Secret",
    prop: "appSecret",
  },
  {
    label: "社交名称",
    prop: "name",
  },
  {
    label: "类型",
    prop: "type",
    transform: (v) => useSocialTypeEnumsEnum().getTagText(v).text,
  },
  {
    label: "重定向地址",
    prop: "redirectUrl",
    transform: (v) => v || "无",
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
    label: "创建时间",
    prop: "updatedAt",
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
