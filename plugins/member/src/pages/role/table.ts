import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { MemberRole, MemberRoleTreeNodeVO } from "@/models";

export const MEMBER_ROLE_TABLE_ID = "member-role";

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
    label: "内置角色",
    prop: "builtIn",
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
    width: "320",
    prop: "actions",
    fixed: "right",
  },
];

export function createMemberRoleToolbarActions(
  onCreate: () => void,
): Array<InTableAction<MemberRole>> {
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

export function createMemberRoleRowActions(
  _row: MemberRoleTreeNodeVO,
  handlers: {
    onDetail: (row: MemberRoleTreeNodeVO) => void;
    onAddChild: (row: MemberRoleTreeNodeVO) => void;
  },
): Array<InTableAction<MemberRoleTreeNodeVO>> {
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "add-child",
      label: "添加子角色",
      kind: "quick",
      onSelect: handlers.onAddChild,
    },
  ];
}
