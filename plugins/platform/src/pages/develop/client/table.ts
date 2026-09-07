import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { OAuth2RegisteredClient } from "@/models";

export const CLIENT_TABLE_ID = "platform-develop-client";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "App",
    prop: "clientName",
    required: true,
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
    minWidth: "132",
  },
  {
    label: "创建时间",
    prop: "clientIdIssuedAt",
    hide: true,
    width: "180",
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

export function createClientToolbarActions(
  onCreate: () => void,
): Array<InTableAction<OAuth2RegisteredClient>> {
  return [
    {
      key: "create",
      label: "添加客户端",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createClientRowActions(
  _row: OAuth2RegisteredClient,
  handlers: {
    onDetail: (row: OAuth2RegisteredClient) => void;
  },
): Array<InTableAction<OAuth2RegisteredClient>> {
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
  ];
}
