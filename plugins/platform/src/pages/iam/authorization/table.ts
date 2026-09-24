import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  AssignmentSource,
  ConfigurationStatus,
  GrantStatus,
  IamAction,
  objectActionAllowed,
  RoleKind,
  SubjectType,
  type AssignmentRecord,
  type DelegationRecord,
  type ResourceDetail,
  type RoleSummary,
} from "@ingot/admin-common";

export const ROLE_TABLE_ID = "platform-iam-roles";
export type RoleRow = ResourceDetail<RoleSummary>;
export type AssignmentRow = ResourceDetail<AssignmentRecord>;
export type DelegationRow = ResourceDetail<DelegationRecord>;

export const emptyRoleRow: RoleRow = {
  record: {
    id: "",
    code: "",
    name: "",
    kind: RoleKind.PLATFORM_CUSTOM,
    status: ConfigurationStatus.ENABLED,
  },
  fieldAccess: {},
  capabilities: {},
  version: "",
};

export const emptyAssignmentRow: AssignmentRow = {
  record: {
    id: "",
    assignment: {
      subject: { type: SubjectType.MEMBER, id: "" },
      roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "" },
      scopeBindings: {},
    },
    status: GrantStatus.ACTIVE,
    source: AssignmentSource.MANUAL,
  },
  fieldAccess: {},
  capabilities: {},
  version: "",
};

export const emptyDelegationRow: DelegationRow = {
  record: {
    id: "",
    delegation: {
      administratorMemberId: "",
      allowedRoleRevisionRefs: [],
      recipientSelection: { members: [], departments: [] },
      actionScopeCeilings: [],
      maxAssignmentDuration: "P30D",
    },
    status: GrantStatus.ACTIVE,
  },
  fieldAccess: {},
  capabilities: {},
  version: "",
};

export const roleHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "编码", prop: "code" },
  { label: "状态", prop: "status" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export const assignmentHeaders: Array<TableHeaderRecord> = [
  { label: "主体", prop: "subject", required: true },
  { label: "角色版本", prop: "roleRevision" },
  { label: "来源", prop: "source" },
  { label: "状态", prop: "status" },
  { label: "失效时间", prop: "validUntil" },
  { label: "操作", width: "200", prop: "actions", fixed: "right" },
];

export const delegationHeaders: Array<TableHeaderRecord> = [
  { label: "管理员", prop: "administratorMemberId", required: true },
  { label: "状态", prop: "status" },
  { label: "最长期限", prop: "maxAssignmentDuration" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createRoleToolbarActions(
  onCreate: () => void,
  onDiagnose: () => void,
): Array<InTableAction<RoleRow>> {
  return [
    {
      key: "create",
      label: "创建角色",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_ROLE_CREATE,
      onSelect: () => onCreate(),
    },
    {
      key: "diagnose",
      label: "权限诊断",
      kind: "primary",
      overflow: "never",
      priority: 30,
      permission: IamAction.PLATFORM_AUTHORIZATION_DIAGNOSE,
      onSelect: () => onDiagnose(),
    },
  ];
}

export function createRoleRowActions(
  row: RoleRow,
  handlers: { onDetail: (row: RoleRow) => void; onDelete: (row: RoleRow) => void },
): Array<InTableAction<RoleRow>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ROLE_READ);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ROLE_DELETE);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_ROLE_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.PLATFORM_ROLE_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}

export function createAssignmentToolbarActions(
  onCreate: () => void,
  onDiagnose: () => void,
): Array<InTableAction<AssignmentRow>> {
  return [
    {
      key: "create",
      label: "分配授权",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_ASSIGNMENT_CREATE,
      onSelect: () => onCreate(),
    },
    {
      key: "diagnose",
      label: "权限诊断",
      kind: "primary",
      overflow: "never",
      priority: 30,
      permission: IamAction.PLATFORM_AUTHORIZATION_DIAGNOSE,
      onSelect: () => onDiagnose(),
    },
  ];
}

export function createAssignmentRowActions(
  row: AssignmentRow,
  handlers: {
    onEdit: (row: AssignmentRow) => void;
    onDelete: (row: AssignmentRow) => void;
    onDiagnose: (row: AssignmentRow) => void;
  },
): Array<InTableAction<AssignmentRow>> {
  const update = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ASSIGNMENT_UPDATE);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ASSIGNMENT_DELETE);
  const memberSubject = row.record.assignment.subject.type === SubjectType.MEMBER;
  return [
    {
      key: "edit",
      label: "修改",
      kind: "default",
      permission: IamAction.PLATFORM_ASSIGNMENT_UPDATE,
      disabled: !update.allowed,
      disabledReason: update.message,
      onSelect: handlers.onEdit,
    },
    {
      key: "diagnose",
      label: "诊断",
      kind: "detail",
      permission: IamAction.PLATFORM_AUTHORIZATION_DIAGNOSE,
      disabled: !memberSubject,
      disabledReason: memberSubject ? undefined : "仅成员主体可预填诊断",
      onSelect: handlers.onDiagnose,
    },
    {
      key: "delete",
      label: "撤销",
      kind: "danger",
      permission: IamAction.PLATFORM_ASSIGNMENT_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}

export function createDelegationToolbarActions(
  onCreate: () => void,
): Array<InTableAction<DelegationRow>> {
  return [
    {
      key: "create",
      label: "创建委派",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_DELEGATION_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createDelegationRowActions(
  row: DelegationRow,
  handlers: { onEdit: (row: DelegationRow) => void; onDelete: (row: DelegationRow) => void },
): Array<InTableAction<DelegationRow>> {
  const update = objectActionAllowed(row.capabilities, IamAction.PLATFORM_DELEGATION_UPDATE);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_DELEGATION_DELETE);
  return [
    {
      key: "edit",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_DELEGATION_READ,
      onSelect: handlers.onEdit,
    },
    {
      key: "update",
      label: "调整",
      kind: "default",
      permission: IamAction.PLATFORM_DELEGATION_UPDATE,
      disabled: !update.allowed,
      disabledReason: update.message,
      onSelect: handlers.onEdit,
    },
    {
      key: "delete",
      label: "撤销",
      kind: "danger",
      permission: IamAction.PLATFORM_DELEGATION_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}
