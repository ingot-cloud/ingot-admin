import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";

export const MEMBER_PERMISSION_TABLE_ID = "member-permission";

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
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "操作",
    width: "320",
    prop: "actions",
    fixed: "right",
  },
];

export function createMemberPermissionToolbarActions(
  onCreate: () => void,
): Array<InTableAction<MemberPermission>> {
  return [
    {
      key: "create",
      label: "添加权限",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createMemberPermissionRowActions(
  row: MemberPermissionTreeNodeVO,
  handlers: {
    onDetail: (row: MemberPermissionTreeNodeVO) => void;
    onAddChild: (row: MemberPermissionTreeNodeVO) => void;
    onToggleStatus: (row: MemberPermissionTreeNodeVO) => void;
  },
): Array<InTableAction<MemberPermissionTreeNodeVO>> {
  const canToggle = Boolean(row.id && row.status);
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
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少权限状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}权限(${row.name})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
  ];
}
