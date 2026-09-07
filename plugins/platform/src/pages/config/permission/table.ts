import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { PermissionTreeNode } from "@/models";

export const PERMISSION_TABLE_ID = "platform-config-permission";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "权限",
    prop: "code",
    required: true,
  },
  {
    label: "名称",
    prop: "name",
    width: "150",
  },
  {
    label: "类型",
    prop: "type",
    width: "100",
  },
  {
    label: "组织类型",
    prop: "orgType",
    width: "100",
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

export function createPermissionRowActions(
  _row: PermissionTreeNode,
  handlers: {
    onEdit: (row: PermissionTreeNode) => void;
  },
): Array<InTableAction<PermissionTreeNode>> {
  return [
    {
      key: "edit",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onEdit,
    },
  ];
}
