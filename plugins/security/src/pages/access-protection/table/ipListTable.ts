import { SecurityAction } from "@/models/securityActions";
import { formatDateTime } from "@ingot/shared";
import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { GatewayIpList } from "@/models";

export const IP_LIST_TABLE_ID = "security-access-ip-list";

export const ipListTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名单类型",
    prop: "listType",
    width: "112",
  },
  {
    label: "Key 类型",
    prop: "keyType",
    width: "140",
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
    width: "100",
  },
  {
    label: "生效时间",
    prop: "effectiveAt",
    transform: formatDateTime,
    minWidth: "160",
  },
  {
    label: "失效时间",
    prop: "expiresAt",
    transform: formatDateTime,
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
      permission: SecurityAction.POLICY_CREATE,
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
  row: GatewayIpList,
  handlers: {
    onDetail: (row: GatewayIpList) => void;
    onDelete: (row: GatewayIpList) => void;
  },
): Array<InTableAction<GatewayIpList>> {
  return [
    {
      key: "detail",
      permission: SecurityAction.POLICY_READ,
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      permission: SecurityAction.POLICY_DELETE,
      label: "删除",
      kind: "danger",
      overflow: "always",
      disabled: !row.id,
      disabledReason: row.id ? undefined : "缺少记录 ID",
      confirm: `是否删除名单(${row.keyValue || row.id})`,
      onSelect: handlers.onDelete,
    },
  ];
}
