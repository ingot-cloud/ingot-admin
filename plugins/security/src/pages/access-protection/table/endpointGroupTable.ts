import { SecurityAction } from "@/models/securityActions";
import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { GatewayEndpointGroup } from "@/models";

export const ENDPOINT_GROUP_TABLE_ID = "security-access-endpoint-group";

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
  },
];

export function createEndpointGroupToolbarActions(
  onCreate: () => void,
): Array<InTableAction<GatewayEndpointGroup>> {
  return [
    {
      key: "create",
      permission: SecurityAction.POLICY_CREATE,
      label: "新建分组",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createEndpointGroupRowActions(
  row: GatewayEndpointGroup,
  handlers: {
    onDetail: (row: GatewayEndpointGroup) => void;
    onDelete: (row: GatewayEndpointGroup) => void;
  },
): Array<InTableAction<GatewayEndpointGroup>> {
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
      confirm: `是否删除分组(${row.name || row.code || row.id})`,
      onSelect: handlers.onDelete,
    },
  ];
}
