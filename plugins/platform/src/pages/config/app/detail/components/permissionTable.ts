import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { AppPermissionTreeNodeVO } from "@/models";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";

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
    label: "托管",
    prop: "managed",
    width: "100",
    hide: true
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
  const isReadOnly = Boolean(row.readOnly);
  const isManaged = Boolean(row.managed);
  const canEdit = !isReadOnly;
  const canMutate = !isReadOnly && !isManaged;
  const mutateReason = isReadOnly
    ? "只读权限不允许该操作"
    : isManaged
      ? "托管权限不允许该操作"
      : undefined;
  const next = row.status ? getCommonStatusToggle(row.status) : undefined;
  const actionDesc = next ? getCommonStatusActionDesc(next) : "切换状态";
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      disabled: !canEdit,
      disabledReason: canEdit ? undefined : "只读权限不允许该操作",
      onSelect: handlers.onDetail,
    },
    {
      key: "add-child",
      label: "添加子权限",
      kind: "quick",
      disabled: !canMutate,
      disabledReason: mutateReason,
      onSelect: handlers.onAddChild,
    },
    {
      key: "toggle-status",
      label: actionDesc,
      kind: "default",
      disabled: !canMutate,
      disabledReason: mutateReason,
      confirm: canMutate ? `是否${actionDesc}权限(${row.name})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
  ];
}
