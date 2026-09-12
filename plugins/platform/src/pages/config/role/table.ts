import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { RoleTreeNodeVO } from "@/models";
import { RoleTypeEnums } from "@/models/enums";

export const ROLE_TABLE_ID = "platform-config-role";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "角色名",
    prop: "name",
    required: true,
  },
  {
    label: "角色编码",
    prop: "code",
    width: "180",
  },
  {
    label: "角色类型",
    prop: "type",
  },
  {
    label: "组织类型",
    prop: "orgType",
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "创建时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "操作",
    width: "240",
    prop: "actions",
    fixed: "right",
  },
];

export function createRoleToolbarActions(
  onCreate: () => void,
): Array<InTableAction<RoleTreeNodeVO>> {
  return [
    {
      key: "create",
      label: "添加角色",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRoleRowActions(
  row: RoleTreeNodeVO,
  handlers: {
    onEdit: (row: RoleTreeNodeVO) => void;
    onAddChild: (row: RoleTreeNodeVO) => void;
    onDataRules?: (row: RoleTreeNodeVO) => void;
  },
): Array<InTableAction<RoleTreeNodeVO>> {
  const actions: Array<InTableAction<RoleTreeNodeVO>> = [
    {
      key: "edit",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onEdit,
    },
    {
      key: "add-child",
      label: "添加子角色",
      kind: "quick",
      onSelect: handlers.onAddChild,
    },
  ];
  if (row.type !== RoleTypeEnums.GROUP && handlers.onDataRules) {
    actions.push({
      key: "data-rules",
      label: "数据范围",
      kind: "default",
      onSelect: handlers.onDataRules,
    });
  }
  return actions;
}
