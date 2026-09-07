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
  _row: GatewayEndpointGroup,
  handlers: {
    onDetail: (row: GatewayEndpointGroup) => void;
  },
): Array<InTableAction<GatewayEndpointGroup>> {
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
  ];
}
