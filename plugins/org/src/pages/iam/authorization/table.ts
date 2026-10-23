import { formatDateTime } from "@ingot/shared";
import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  AssignmentSource,
  AssignmentEffectiveStatus,
  ConfigurationStatus,
  GrantStatus,
  IamAction,
  objectActionAllowed,
  RoleKind,
  SubjectType,
  type TenantAssignmentRecord,
  type TenantDelegationRecord,
  type ResourceDetail,
  type RoleSummary,
} from "@ingot/admin-common";

export const SYSTEM_ROLE_TAG = { text: "系统角色", tag: "primary" as const };

export const ASSIGNMENT_TABLE_ID = "org-iam-assignments";
export const DELEGATION_TABLE_ID = "org-iam-delegations";
export type RoleRow = ResourceDetail<RoleSummary>;
export type AssignmentRow = ResourceDetail<TenantAssignmentRecord>;
export type DelegationRow = ResourceDetail<TenantDelegationRecord>;

export const emptyRoleRow: RoleRow = {
  record: {
    id: "",
    code: "",
    name: "",
    kind: RoleKind.TENANT_CUSTOM,
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
      roleId: "",
      scopeBindings: {},
    },
    status: GrantStatus.ACTIVE,
    source: AssignmentSource.MANUAL,
    roleKind: RoleKind.TENANT_CUSTOM,
    effectiveStatus: AssignmentEffectiveStatus.ACTIVE,
    scopeIssues: [],
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
      allowedRoleIds: [],
      recipientSelection: { members: [], departments: [] },
      resourceScopeCeilings: [],
      maxAssignmentDuration: "P30D",
    },
    status: GrantStatus.ACTIVE,
    scopeIssues: [],
  },
  fieldAccess: {},
  capabilities: {},
  version: "",
};

export const assignmentHeaders: Array<TableHeaderRecord> = [
  { label: "主体", prop: "subject", required: true, minWidth: 220, showOverflowTooltip: true },
  { label: "角色", prop: "role", minWidth: 180, showOverflowTooltip: true },
  { label: "来源", prop: "source", minWidth: 140, showOverflowTooltip: true },
  { label: "状态", prop: "status", minWidth: 140 },
  {
    label: "生效时间",
    prop: "validFrom",
    transform: formatDateTime,
    minWidth: 180,
    showOverflowTooltip: true,
  },
  {
    label: "失效时间",
    prop: "validUntil",
    transform: formatDateTime,
    minWidth: 180,
    showOverflowTooltip: true,
  },
  { label: "操作", width: "200", prop: "actions", fixed: "right" },
];

export const delegationHeaders: Array<TableHeaderRecord> = [
  {
    label: "管理员",
    prop: "administratorMemberId",
    required: true,
    minWidth: 190,
    showOverflowTooltip: true,
  },
  { label: "状态", prop: "status", minWidth: 100 },
  { label: "创建时间", prop: "createdAt", minWidth: 180, showOverflowTooltip: true },
  { label: "有效期", prop: "validity", minWidth: 320, showOverflowTooltip: true },
  { label: "最长期限", prop: "maxAssignmentDuration", minWidth: 160, showOverflowTooltip: true },
  { label: "操作", width: "140", prop: "actions", fixed: "right" },
];

export const delegationValidity = (row: DelegationRow): string => {
  const from = formatDateTime(row.record.delegation.validFrom, { fallback: "立即生效" });
  const until = formatDateTime(row.record.delegation.validUntil, { fallback: "长期有效" });
  return `${from} 至 ${until}`;
};

export function createRoleRowActions(
  row: RoleRow,
  handlers: { onDetail: (row: RoleRow) => void; onDelete: (row: RoleRow) => void },
): Array<InTableAction<RoleRow>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.TENANT_ROLE_READ);
  const remove = objectActionAllowed(row.capabilities, IamAction.TENANT_ROLE_DELETE);
  const actions: Array<InTableAction<RoleRow>> = [
    {
      key: "detail",
      label: "详情",
      kind: "default",
      permission: IamAction.TENANT_ROLE_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
  if (row.record.kind === RoleKind.SHARED) return actions;
  actions.push({
    key: "delete",
    label: "删除",
    kind: "danger",
    permission: IamAction.TENANT_ROLE_DELETE,
    disabled: !remove.allowed,
    disabledReason: remove.message,
    onSelect: handlers.onDelete,
  });
  return actions;
}

export function createAssignmentToolbarActions(
  onCreate: () => void,
  onDiagnose: () => void,
): Array<InTableAction<AssignmentRow>> {
  return [
    {
      key: "create",
      label: "分配角色",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.TENANT_ASSIGNMENT_CREATE,
      onSelect: () => onCreate(),
    },
    {
      key: "diagnose",
      label: "权限诊断",
      kind: "default",
      overflow: "auto",
      priority: 30,
      permission: IamAction.TENANT_AUTHORIZATION_DIAGNOSE,
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
  const update = objectActionAllowed(row.capabilities, IamAction.TENANT_ASSIGNMENT_UPDATE);
  const remove = objectActionAllowed(row.capabilities, IamAction.TENANT_ASSIGNMENT_DELETE);
  const memberSubject = row.record.assignment.subject.type === SubjectType.MEMBER;
  return [
    {
      key: "edit",
      label: "修改",
      kind: "default",
      permission: IamAction.TENANT_ASSIGNMENT_UPDATE,
      disabled: !update.allowed,
      disabledReason: update.message,
      onSelect: handlers.onEdit,
    },
    {
      key: "diagnose",
      label: "诊断",
      kind: "detail",
      permission: IamAction.TENANT_AUTHORIZATION_DIAGNOSE,
      disabled: !memberSubject,
      disabledReason: memberSubject ? undefined : "仅成员主体可预填诊断",
      onSelect: handlers.onDiagnose,
    },
    {
      key: "delete",
      label: "撤销",
      kind: "danger",
      permission: IamAction.TENANT_ASSIGNMENT_DELETE,
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
      permission: IamAction.TENANT_DELEGATION_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createDelegationRowActions(
  row: DelegationRow,
  handlers: {
    onDetail: (row: DelegationRow) => void;
    onDelete: (row: DelegationRow) => void;
  },
): Array<InTableAction<DelegationRow>> {
  const remove = objectActionAllowed(row.capabilities, IamAction.TENANT_DELEGATION_DELETE);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.TENANT_DELEGATION_READ,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "撤销",
      kind: "danger",
      permission: IamAction.TENANT_DELEGATION_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}
