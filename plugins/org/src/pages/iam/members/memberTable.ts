import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  MemberStatus,
  objectActionAllowed,
  type MemberDepartmentView,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";

export const TABLE_ID = "org-iam-members-v3";
export const MEMBER_SPLIT_KEY = "org-iam-members";
export const MEMBER_AVATAR_SIZE = 30;
export const MEMBER_BATCH_GROUP = "batch";
export const SELECT_MEMBERS_FIRST = "请先选择成员";
export const OWNER_BATCH_EXCLUDED = "组织拥有者不能被暂停、移出或变更部门";
export const MEMBER_NAME_COLUMN_LABEL = "姓名";
export const MEMBER_PHONE_LENGTH = 11;
export const MEMBER_PHONE_PATTERN = new RegExp(`^\\d{${MEMBER_PHONE_LENGTH}}$`);
export const MEMBER_JOINED_EXISTING = "该手机号已有账号，已加入组织";
export const MEMBER_REJOINED = "该成员已重新加入组织，原有角色和用户组已清除";
export const MEMBER_PHONE_INVALID = "请输入11位手机号";
export const MEMBER_WORKBOOK_PATH = "/org/iam/members/workbook";
export const MEMBER_LIST_PATH = "/org/iam/members";
export const MEMBER_WORKBOOK_TITLE = "批量导入或导出成员";

export function plainMemberPhone(value?: string): string {
  return value && MEMBER_PHONE_PATTERN.test(value) ? value : "";
}

export function plainMemberEmail(value?: string): string {
  return value && !value.includes("*") ? value : "";
}
export type Row = ResourceDetail<MemberRecord>;

export { formatSelectionColumnLabel } from "./selectionHeader";

export const tableHeaders: Array<TableHeaderRecord> = [
  { type: "selection", prop: "selection", width: "48", headerCheckbox: true },
  { label: MEMBER_NAME_COLUMN_LABEL, prop: "displayName", required: true, minWidth: "200" },
  { label: "账号状态", prop: "status", minWidth: "132" },
  { label: "手机号", prop: "phone", minWidth: "140" },
  { label: "部门", prop: "departments", minWidth: "160" },
  { label: "登录手机号", prop: "loginPhone", minWidth: "140" },
  { label: "邮箱", prop: "email", hide: true, minWidth: "180" },
  { label: "入职时间", prop: "joinedAt", hide: true, minWidth: "180" },
  { label: "更新时间", prop: "updatedAt", hide: true, minWidth: "180" },
  { label: "操作", width: "200", prop: "actions", fixed: "right" },
];

export function formatMemberDepartments(departments?: MemberDepartmentView[]): string {
  if (!departments?.length) {
    return "-";
  }
  const names = [...departments]
    .sort((left, right) => Number(right.primary) - Number(left.primary))
    .map((item) => item.name.trim())
    .filter((name) => name.length > 0);
  return names.length > 0 ? names.join("、") : "-";
}

export function collectActiveMembers(rows: Row[]): Row[] {
  return rows.filter((item) => item.record.id && item.record.status !== MemberStatus.REMOVED);
}

export function isTenantOwnerMember(memberId: string | undefined, ownerMemberId?: string): boolean {
  return Boolean(ownerMemberId) && memberId === ownerMemberId;
}

export function collectOperableMembers(rows: Row[], ownerMemberId?: string): Row[] {
  return collectActiveMembers(rows).filter(
    (item) => !isTenantOwnerMember(item.record.id, ownerMemberId),
  );
}

export function createToolbarActions(handlers: {
  onCreate: () => void;
  onImportExport: () => void;
  onChangeDept: () => void;
  onResign: () => void;
  selectedCount: number;
  operableCount: number;
  canImportExport?: boolean;
}): Array<InTableAction<Row>> {
  const hasSelection = handlers.selectedCount > 0;
  const hasOperable = handlers.operableCount > 0;
  const batchReason = hasSelection ? OWNER_BATCH_EXCLUDED : SELECT_MEMBERS_FIRST;
  const actions: Array<InTableAction<Row>> = [
    {
      key: "leave",
      label: "批量操作离职",
      kind: "danger",
      overflow: "auto",
      overflowGroup: MEMBER_BATCH_GROUP,
      priority: 10,
      permission: IamAction.TENANT_MEMBER_REMOVE,
      disabled: !hasOperable,
      disabledReason: hasOperable ? undefined : batchReason,
      confirm: hasOperable
        ? `移出不删除全局账号。是否将已选的 ${handlers.operableCount} 名成员操作离职？`
        : undefined,
      onSelect: () => handlers.onResign(),
    },
    {
      key: "dept",
      label: "批量变更部门",
      kind: "default",
      overflow: "auto",
      overflowGroup: MEMBER_BATCH_GROUP,
      priority: 20,
      permission: IamAction.TENANT_MEMBER_DEPARTMENTS,
      disabled: !hasOperable,
      disabledReason: hasOperable ? undefined : batchReason,
      onSelect: () => handlers.onChangeDept(),
    },
  ];
  if (handlers.canImportExport !== false) {
    actions.push({
      key: "import",
      label: "批量导入/导出",
      kind: "primary",
      overflow: "auto",
      overflowGroup: MEMBER_BATCH_GROUP,
      priority: 30,
      onSelect: () => handlers.onImportExport(),
    });
  }
  actions.push(
    {
      key: "create",
      label: "添加成员",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      permission: IamAction.TENANT_MEMBER_CREATE,
      onSelect: () => handlers.onCreate(),
    },
  );
  return actions;
}

export function createRowActions(
  row: Row,
  handlers: {
    onDetail: (row: Row) => void;
    onSuspend: (row: Row) => void;
    onRestore: (row: Row) => void;
    onRemove: (row: Row) => void;
    onRejoin: (row: Row) => void;
  },
  ownerMemberId?: string,
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.TENANT_MEMBER_READ);
  const status = objectActionAllowed(row.capabilities, IamAction.TENANT_MEMBER_STATUS);
  const remove = objectActionAllowed(row.capabilities, IamAction.TENANT_MEMBER_REMOVE);
  const protectedOwner = isTenantOwnerMember(row.record.id, ownerMemberId);
  const actions: Array<InTableAction<Row>> = [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.TENANT_MEMBER_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
  if (!protectedOwner && row.record.status === MemberStatus.ACTIVE) {
    actions.push({
      key: "suspend",
      label: "暂停",
      kind: "default",
      permission: IamAction.TENANT_MEMBER_STATUS,
      disabled: !status.allowed,
      disabledReason: status.message,
      onSelect: handlers.onSuspend,
    });
  }
  if (!protectedOwner && row.record.status === MemberStatus.SUSPENDED) {
    actions.push({
      key: "restore",
      label: "恢复",
      kind: "default",
      permission: IamAction.TENANT_MEMBER_STATUS,
      disabled: !status.allowed,
      disabledReason: status.message,
      onSelect: handlers.onRestore,
    });
  }
  if (!protectedOwner && row.record.status !== MemberStatus.REMOVED) {
    actions.push({
      key: "remove",
      label: "移出",
      kind: "danger",
      permission: IamAction.TENANT_MEMBER_REMOVE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onRemove,
    });
  }
  if (row.record.status === MemberStatus.REMOVED) {
    actions.push({
      key: "rejoin",
      label: "重新加入",
      kind: "default",
      permission: IamAction.TENANT_MEMBER_CREATE,
      onSelect: handlers.onRejoin,
    });
  }
  return actions;
}
