import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "App",
    prop: "clientName",
  },
  {
    label: "Required PKCE",
    prop: "requireProofKey",
  },
  {
    label: "Token存活时间",
    prop: "accessTokenTimeToLive",
  },
  {
    label: "认证类型",
    prop: "tokenAuthType",
  },
  {
    label: "状态",
    prop: "status",
    align: "center",
  },
  {
    label: "创建时间",
    prop: "clientIdIssuedAt",
    hide: true,
    width: "180",
  },
  {
    label: "操作",
    width: "210",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
