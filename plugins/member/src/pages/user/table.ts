import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { MemberUser } from "@/models";

export const MEMBER_USER_TABLE_ID = "member-user";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "用户",
    prop: "avatar",
    required: true,
    minWidth: "200",
  },
  {
    label: "账号",
    prop: "username",
  },
  {
    label: "昵称",
    prop: "nickname",
    hide: true,
  },
  {
    label: "手机号",
    prop: "phone",
  },
  {
    label: "email",
    prop: "email",
    transform: (v) => v || "-",
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
    required: true,
  },
  {
    label: "注册时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

export function createMemberUserToolbarActions(
  onCreate: () => void,
): Array<InTableAction<MemberUser>> {
  return [
    {
      key: "create",
      label: "添加用户",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createMemberUserRowActions(
  row: MemberUser,
  handlers: {
    onDetail: (row: MemberUser) => void;
    onToggleEnabled: (row: MemberUser) => void;
    onLock: (row: MemberUser) => void;
    onResetPassword: (row: MemberUser) => void;
  },
): Array<InTableAction<MemberUser>> {
  const displayName = row.nickname || row.username || row.id || "";
  const canToggle = Boolean(row.id && typeof row.enabled === "boolean");
  const actionDesc = row.enabled ? "暂停账号" : "恢复账号";
  const lockLabel = row.locked ? "解锁" : "锁定";
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "toggle-enabled",
      label: actionDesc,
      kind: "default",
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少账号可用状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}(${displayName})` : undefined,
      onSelect: handlers.onToggleEnabled,
    },
    {
      key: "lock",
      label: lockLabel,
      kind: "default",
      disabled: !row.id,
      disabledReason: row.id ? undefined : "缺少用户标识，无法锁定",
      onSelect: handlers.onLock,
    },
    {
      key: "reset-password",
      label: "重置密码",
      kind: "danger",
      confirm: `是否重置该用户(${displayName})密码`,
      onSelect: handlers.onResetPassword,
    },
  ];
}
