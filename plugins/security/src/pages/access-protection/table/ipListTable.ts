import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { GatewayIpList } from "@/models";

export const IP_LIST_TABLE_ID = "security-access-ip-list";

export const ipListTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名单类型",
    prop: "listType",
    width: "100",
  },
  {
    label: "Key 类型",
    prop: "keyType",
    width: "110",
  },
  {
    label: "匹配值",
    prop: "keyValue",
    minWidth: "180",
  },
  {
    label: "原因",
    prop: "reason",
    minWidth: "140",
  },
  {
    label: "来源",
    prop: "source",
    width: "90",
  },
  {
    label: "生效时间",
    prop: "effectiveAt",
    minWidth: "160",
  },
  {
    label: "失效时间",
    prop: "expiresAt",
    minWidth: "160",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
  },
];

export function createIpListToolbarActions(
  onCreate: () => void,
): Array<InTableAction<GatewayIpList>> {
  return [
    {
      key: "create",
      label: "新建名单",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createIpListRowActions(
  _row: GatewayIpList,
  handlers: {
    onDetail: (row: GatewayIpList) => void;
  },
): Array<InTableAction<GatewayIpList>> {
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
  ];
}
