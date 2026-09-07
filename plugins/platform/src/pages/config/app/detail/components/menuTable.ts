import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { MenuTreeNode } from "@/models";

export const MENU_TABLE_ID = "platform-config-app-detail-menu";

export const menuTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "图标",
    prop: "menuType",
    minWidth: "80",
  },
  {
    label: "菜单名称",
    prop: "name",
    minWidth: "200",
    required: true,
  },
  {
    label: "路由",
    prop: "path",
  },
  {
    label: "权限",
    prop: "accessMode",
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "备注",
    prop: "remark",
  },
  {
    label: "操作",
    width: "160",
    prop: "actions",
    fixed: "right",
  },
];

export function createMenuToolbarActions(onCreate: () => void): Array<InTableAction<MenuTreeNode>> {
  return [
    {
      key: "create",
      label: "添加菜单",
      kind: "quick",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createMenuRowActions(
  row: MenuTreeNode,
  handlers: {
    onDetail: (row: MenuTreeNode) => void;
    onAddChild: (row: MenuTreeNode) => void;
  },
): Array<InTableAction<MenuTreeNode>> {
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "add-child",
      label: "添加子菜单",
      kind: "quick",
      onSelect: handlers.onAddChild,
    },
  ];
}
