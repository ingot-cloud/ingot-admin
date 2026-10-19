import type {
  ScopeBindingKind,
  GrantStatus,
  AssignmentSource,
  AssignmentEffectiveStatus,
  ScopeKind,
} from "./constants";
import type { Page, R } from "@ingot/admin-core";
import type {
  ActionGrant,
  ScopeExpression,
  ScopeBinding,
  RoleSummary,
  ResourceDetail,
  Preview,
  CreatedResource,
  Selection,
  SubjectRef,
} from "./types";
export interface CurrentRoleParameter {
  key: string;
  kind: ScopeBindingKind;
  resourceId: string;
}
export interface CurrentRoleDefinition {
  grants: ActionGrant[];
  parameterDefinitions: CurrentRoleParameter[];
}
export type CurrentRoleSummary = RoleSummary;
export interface CurrentRoleCatalogAction {
  actionId: string;
  actionCode: string;
  actionName: string;
  applicationId: string;
  applicationName: string;
  resourceId: string;
  resourceName: string;
  enabled: boolean;
  scopeCapabilities: ScopeKind[];
  parameterDefinitions: CurrentRoleParameter[];
}
export interface CurrentRoleGrantList {
  items: CurrentRoleCatalogAction[];
  definition: CurrentRoleDefinition;
}
export interface CurrentRoleCreateInput {
  code: string;
  name: string;
  description?: string;
  groupName?: string;
  definition: CurrentRoleDefinition;
}
export interface CurrentRolePermissionInput {
  expectedVersion: string;
  definition: CurrentRoleDefinition;
}
export interface CurrentRoleProfileInput {
  expectedVersion: string;
  name?: string;
  description?: string;
  groupName?: string;
  status: RoleSummary["status"];
}
export interface CurrentRolePermissionResult {
  roleId: string;
  version: string;
  scopeIssueAssignments?: number;
}
export interface CurrentRolePreviewResult {
  definition: CurrentRoleDefinition;
  addedActionIds: string[];
  removedActionIds: string[];
  changedScopeActionIds: string[];
  scopeIssueAssignments?: number;
}
export interface CurrentRoleApis {
  createAPI: (input: CurrentRoleCreateInput) => Promise<R<CreatedResource>>;
  createPreviewAPI: (
    input: CurrentRoleCreateInput,
  ) => Promise<R<Preview<CurrentRolePreviewResult>>>;
  detailAPI: (id: string) => Promise<R<ResourceDetail<CurrentRoleSummary>>>;
  grantsAPI: (id: string) => Promise<R<CurrentRoleGrantList>>;
  previewAPI: (
    id: string,
    input: CurrentRolePermissionInput,
  ) => Promise<R<Preview<CurrentRolePreviewResult>>>;
  saveAPI: (
    id: string,
    input: CurrentRolePermissionInput,
  ) => Promise<R<CurrentRolePermissionResult>>;
  profileAPI: (
    id: string,
    input: CurrentRoleProfileInput,
  ) => Promise<R<ResourceDetail<CurrentRoleSummary>>>;
}
export interface ScopeIssue {
  resourceId: string;
  actionIds: string[];
  parameterKey?: string;
  reason: "MISSING_BINDING" | "INVALID_BINDING" | "MISSING_RESOURCE_CEILING";
}
export interface TenantAssignmentInput {
  subject: SubjectRef;
  roleId: string;
  scopeBindings: Record<string, ScopeBinding>;
  validFrom?: string;
  validUntil?: string;
  delegationGrantId?: string;
}
export interface TenantAssignmentRecord {
  id: string;
  assignment: TenantAssignmentInput;
  status: GrantStatus;
  source: AssignmentSource;
  subjectName?: string;
  roleName?: string;
  roleKind: RoleSummary["kind"];
  delegationSummary?: string;
  createdAt?: string;
  effectiveStatus: AssignmentEffectiveStatus;
  scopeIssues: ScopeIssue[];
}
export interface ResourceScopeCeiling {
  resourceId: string;
  scopes: ScopeExpression[];
  scopeBindings: Record<string, ScopeBinding>;
}
export interface TenantDelegationInput {
  administratorMemberId: string;
  allowedRoleIds: string[];
  recipientSelection: Selection;
  resourceScopeCeilings: ResourceScopeCeiling[];
  validFrom?: string;
  validUntil?: string;
  maxAssignmentDuration: string;
  assignmentDurationMode?: "LIMITED";
}
export interface TenantDelegationRecord {
  id: string;
  delegation: TenantDelegationInput;
  status: GrantStatus;
  administratorName?: string;
  scopeIssues: ScopeIssue[];
}
export interface TenantDelegationMine {
  id: string;
  allowedRoles: CurrentRoleSummary[];
  recipientSummary: string;
  directAssignmentActions: string[];
  validFrom?: string;
  validUntil?: string;
  maxAssignmentDuration: string;
  scopeIssues: ScopeIssue[];
}
export type TenantAssignmentOptionKind =
  "ROLE" | "MEMBER" | "GROUP" | "RESOURCE" | "APPLICATION" | "DEPARTMENT";
export interface TenantAssignmentOption {
  departments?: import("./types").MemberDepartmentView[];
  id: string;
  name: string;
  kind: TenantAssignmentOptionKind;
  roleKind?: RoleSummary["kind"];
}
export type CurrentGrantCatalogAPI = (
  applicationId: string,
  page: Page,
  keyword?: string,
) => Promise<R<Page<CurrentRoleCatalogAction>>>;

export interface TenantAssignmentApis {
  optionsAPI: (query: {
    departmentId?: string;
    kind: TenantAssignmentOptionKind;
    delegationGrantId?: string;
    keyword?: string;
    ids?: string[];
    page?: number;
    pageSize?: number;
  }) => Promise<R<import("./types").IamPageResponse<TenantAssignmentOption>>>;
  roleAPI: (id: string, source?: string) => Promise<R<CurrentRoleGrantList>>;
  mineAPI: () => Promise<R<TenantDelegationMine[]>>;
  scopeAPI: (query: {
    roleId: string;
    parameterKey: string;
    delegationGrantId?: string;
    keyword?: string;
    ids?: string[];
    page?: number;
    pageSize?: number;
    tree?: boolean;
    parentId?: string;
  }) => Promise<R<import("./types").AuthorizationCandidatePage>>;
  createAPI: (input: { items: TenantAssignmentInput[] }) => Promise<R<CreatedResource>>;
  previewAPI: (input: {
    items: TenantAssignmentInput[];
  }) => Promise<R<Preview<import("./types").AssignmentPreviewResult>>>;
  updateAPI: (
    id: string,
    input: { expectedVersion: string; assignment: TenantAssignmentInput },
  ) => Promise<R<ResourceDetail<TenantAssignmentRecord>>>;
}
export interface TenantDelegationApis {
  createAPI: (input: TenantDelegationInput) => Promise<R<CreatedResource>>;
  detailAPI: (id: string) => Promise<R<ResourceDetail<TenantDelegationRecord>>>;
  updateAPI: (
    id: string,
    input: { expectedVersion: string; delegation: TenantDelegationInput },
  ) => Promise<R<ResourceDetail<TenantDelegationRecord>>>;
  previewAPI: (
    id: string,
    input: { expectedVersion: string; delegation: TenantDelegationInput },
  ) => Promise<R<Preview<import("./types").ReferenceImpactPreview>>>;
  scopeAPI: (query: {
    resourceId: string;
    parameterKey: string;
    keyword?: string;
    ids?: string[];
    page?: number;
    pageSize?: number;
  }) => Promise<R<import("./types").AuthorizationCandidatePage>>;
}
