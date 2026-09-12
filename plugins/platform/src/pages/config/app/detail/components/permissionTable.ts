import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { AppPermissionTreeNodeVO } from "@/models";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";
import { isAppRootPermission } from "./permissionTree";

export const PERMISSION_TABLE_ID = "platform-config-app-detail-permission";

export const permissionTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "权限编码",
    prop: "code",
    minWidth: "200",
  },
  {
    label: "名称",
    prop: "name",
    width: "150",
    required: true,
  },
  {
    label: "节点类型",
    prop: "nodeType",
    width: "120",
  },
  {
    label: "资源",
    prop: "resourceId",
    width: "140",
    hide: true,
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "80",
  },
  {
    label: "操作",
    width: "240",
    prop: "actions",
    fixed: "right",
  },
];

export function createPermissionToolbarActions(
  onCreate: () => void,
): Array<InTableAction<AppPermissionTreeNodeVO>> {
  return [
    {
      key: "create",
      label: "添加权限",
      kind: "quick",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createPermissionRowActions(
  row: AppPermissionTreeNodeVO,
  handlers: {
    onDetail: (row: AppPermissionTreeNodeVO) => void;
    onAddChild: (row: AppPermissionTreeNodeVO) => void;
    onToggleStatus: (row: AppPermissionTreeNodeVO) => void;
  },
): Array<InTableAction<AppPermissionTreeNodeVO>> {
  const root = isAppRootPermission(row);
  const next = row.status ? getCommonStatusToggle(row.status) : undefined;
  const actionDesc = next ? getCommonStatusActionDesc(next) : "切换状态";
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "add-child",
      label: "添加子权限",
      kind: "quick",
      onSelect: handlers.onAddChild,
    },
    {
      key: "toggle-status",
      label: actionDesc,
      kind: "default",
      disabled: root,
      disabledReason: root ? "应用根权限不可停用" : undefined,
      confirm: root ? undefined : `是否${actionDesc}权限(${row.name})`,
      onSelect: handlers.onToggleStatus,
    },
  ];
}
