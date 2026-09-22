import {
  AccountLookupPurpose,
  AssignmentSource,
  AudienceKind,
  AuthorizationDomain,
  ConfigurationStatus,
  DefaultPolicyKind,
  DirectoryDefaultScope,
  EntitlementSource,
  ExportTaskStatus,
  FieldVisibility,
  GrantStatus,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  MemberStatus,
  PolicyEffect,
  PolicyScenario,
  RoleDeltaOperation,
  RoleKind,
  ScopeBindingKind,
  ScopeKind,
  SubjectType,
  UpgradeResolutionChoice,
} from "./constants";

export interface AuthorizationContext {
  domain: AuthorizationDomain;
  tenantId?: string | null;
  accountId: string;
  memberId: string;
}

export interface CurrentProfile {
  memberId: string;
  displayName: string;
  avatar?: string;
}

export interface ApplicationSummary {
  id: string;
  code: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface IamMenuNode {
  id: string;
  applicationId: string;
  name: string;
  kind: MenuKind;
  path?: string;
  viewPath?: string;
  routeName?: string;
  icon?: string;
  sortOrder: number;
  children: IamMenuNode[];
}

export interface IamBootstrap {
  context: AuthorizationContext;
  profile: CurrentProfile;
  applications: ApplicationSummary[];
  menus: IamMenuNode[];
  actionCodes: string[];
  version: string;
  expiresAt: string;
}

export interface CurrentCapabilities {
  actionCodes: string[];
  version: string;
  expiresAt: string;
}

export interface CreatedResource {
  id: string;
  version: string;
}

export interface VersionInput {
  expectedVersion: string;
}

export interface ConfigurationStatusInput extends VersionInput {
  status: ConfigurationStatus;
}

export interface FieldAccess {
  visibility: FieldVisibility;
  editable?: boolean;
}

export type FieldAccessMap = Record<string, FieldAccess>;

export interface ObjectCapability {
  allowed?: boolean;
  reasonCode?: string;
  message?: string;
}

export type ObjectCapabilities = Record<string, ObjectCapability>;

export interface ResourceDetail<T> {
  record: T;
  fieldAccess: FieldAccessMap;
  capabilities: ObjectCapabilities;
  version: string;
}

export interface IamPageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IamListQuery {
  name?: string;
  status?: string;
  baseline?: boolean;
  keyword?: string;
  departmentId?: string;
  domain?: string;
}

export interface ResourceListQuery {
  name?: string;
  code?: string;
}

export interface ActionListQuery {
  resourceId?: string;
  name?: string;
  ids?: string;
}

export interface AccountListQuery {
  username?: string;
  phone?: string;
  email?: string;
}

export interface AccountRecord {
  id: string;
  username: string;
  phone?: string;
  email?: string;
  enabled?: boolean;
  locked?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
}

export interface AccountCreateInput {
  username: string;
  phone?: string;
  email?: string;
}

export interface AccountUpdateInput extends VersionInput {
  phone?: string;
  email?: string;
}

export interface AccountLockInput extends VersionInput {
  reasonDetail?: string;
  lockedUntil?: string;
}

export interface AccountLookupInput {
  purpose: AccountLookupPurpose;
  username?: string;
  phone?: string;
  email?: string;
}

export interface AccountSecret {
  password: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  avatar?: string;
  ownerMemberId: string;
  ownerDisplayName?: string;
  status: ConfigurationStatus;
}

export interface TenantCreateInput {
  name: string;
  ownerAccountId: string;
  ownerDisplayName?: string;
  rootDepartmentName?: string;
  avatar?: string;
  planId?: string;
}

export interface TenantPreviewResult {
  name: string;
  ownerAccountId: string;
  ownerDisplayName: string;
  rootDepartmentName: string;
  applications: ApplicationSummary[];
  planId?: string;
}

export interface TenantUpdateInput extends VersionInput {
  name: string;
  avatar?: string;
  status: ConfigurationStatus;
}

export interface TenantSettingsInput extends VersionInput {
  name: string;
  avatar?: string;
}

export interface OwnerTransferInput extends VersionInput {
  newOwnerMemberId: string;
}

export interface ApplicationRecord {
  id: string;
  code: string;
  domain: AuthorizationDomain;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  baseline: boolean;
  status: ConfigurationStatus;
}

export interface ApplicationDraft {
  code: string;
  domain: AuthorizationDomain;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  baseline: boolean;
}

export interface ApplicationUpdateInput extends VersionInput {
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  baseline: boolean;
}

export interface PlanRecord {
  id: string;
  name: string;
  description?: string;
  applicationIds: string[];
  status: ConfigurationStatus;
}

export interface PlanDraft {
  name: string;
  description?: string;
  applicationIds: string[];
}

export interface PlanUpdateInput extends VersionInput {
  plan: PlanDraft;
}

export interface FieldCapability {
  key: string;
  label: string;
  visibilities: FieldVisibility[];
  editable: boolean;
  filterable: boolean;
  sortable: boolean;
}

export interface AppResourceRecord {
  id: string;
  applicationId: string;
  code: string;
  name: string;
  scopeCapabilities: ScopeKind[];
  fieldCapabilities: FieldCapability[];
  status: ConfigurationStatus;
}

export interface AppResourceDraft {
  code: string;
  name: string;
  scopeCapabilities: ScopeKind[];
  fieldCapabilities: FieldCapability[];
}

export interface AppResourceUpdateInput extends VersionInput {
  name: string;
  scopeCapabilities: ScopeKind[];
  fieldCapabilities: FieldCapability[];
}

export interface AppActionRecord {
  id: string;
  applicationId: string;
  resourceId: string;
  code: string;
  name: string;
  status: ConfigurationStatus;
}

export interface AppActionDraft {
  resourceId: string;
  code: string;
  name: string;
}

export interface AppActionUpdateInput extends VersionInput {
  name: string;
}

export interface AppMenuRecord {
  id: string;
  applicationId: string;
  parentId?: string;
  name: string;
  kind: MenuKind;
  path?: string;
  viewPath?: string;
  routeName?: string;
  icon?: string;
  accessMode: MenuAccessMode;
  matchMode: MenuMatchMode;
  actionIds: string[];
  sortOrder: number;
  status: ConfigurationStatus;
}

export interface MenuTreeRow extends ResourceDetail<AppMenuRecord> {
  children: MenuTreeRow[];
}

export interface AppMenuDraft {
  parentId?: string;
  name: string;
  kind: MenuKind;
  path?: string;
  viewPath?: string;
  routeName?: string;
  icon?: string;
  accessMode: MenuAccessMode;
  matchMode: MenuMatchMode;
  actionIds: string[];
  sortOrder: number;
}

export interface AppMenuUpdateInput extends VersionInput {
  menu: AppMenuDraft;
}

export interface MemberDepartmentView {
  id: string;
  name: string;
  primary: boolean;
}

export interface MemberRecord {
  id: string;
  displayName?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  status: MemberStatus;
  departments: MemberDepartmentView[];
}

export interface MemberCreateInput {
  accountId: string;
  displayName?: string;
  departments: MemberDepartmentBinding[];
}

export interface MemberDepartmentBinding {
  id: string;
  primary: boolean;
}

export interface MemberProfileInput extends VersionInput {
  displayName?: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface MemberStatusInput extends VersionInput {
  status: MemberStatus.ACTIVE | MemberStatus.SUSPENDED;
}

export interface MemberDepartmentInput extends VersionInput {
  departments: MemberDepartmentBinding[];
}

export interface DepartmentRecord {
  id: string;
  parentId?: string;
  name: string;
  sortOrder: number;
  navigationOnly: boolean;
}

export interface DepartmentDraft {
  parentId?: string;
  name: string;
  sortOrder: number;
}

export interface DepartmentUpdateInput extends VersionInput {
  department: DepartmentDraft;
}

export interface ExportTask {
  id: string;
  status: ExportTaskStatus;
  version: string;
  expiresAt: string;
  failureCode?: string;
}

export interface DepartmentSelection {
  id: string;
  includeDescendants?: boolean;
}

export interface Selection {
  members: string[];
  departments: DepartmentSelection[];
}

export interface GroupRecord {
  id: string;
  name: string;
  description?: string;
  selection: Selection;
  visibleMemberCount?: number;
}

export interface GroupDraft {
  name: string;
  description?: string;
  selection: Selection;
}

export interface GroupUpdateInput extends VersionInput {
  group: GroupDraft;
}

export interface SubjectRef {
  type: SubjectType;
  id: string;
}

export interface ScopeExpression {
  kind: ScopeKind;
  parameterKey?: string;
  includeDescendants?: boolean;
}

export interface ScopeBinding {
  kind: ScopeBindingKind;
  ids: string[];
}

export interface ActionGrant {
  actionId: string;
  scopes: ScopeExpression[];
}

export interface RoleParameterDefinition {
  key: string;
  kind: ScopeBindingKind;
}

export interface RoleMetadataOverrides {
  name?: string;
  description?: string;
  groupName?: string;
}

export interface RoleDelta {
  actionId: string;
  operation: RoleDeltaOperation;
  scopes?: ScopeExpression[];
}

export interface RoleDefinitionDraft {
  grants: ActionGrant[];
  deltas: RoleDelta[];
  parameterDefinitions: RoleParameterDefinition[];
  metadataOverrides?: RoleMetadataOverrides;
}

export type RoleCreateKind = RoleKind.SHARED | RoleKind.PLATFORM_CUSTOM | RoleKind.TENANT_CUSTOM;

export interface RoleCreateInput {
  code: string;
  name: string;
  description?: string;
  groupName?: string;
  kind: RoleCreateKind;
  baseRevisionId?: string;
  definition: RoleDefinitionDraft;
}

export interface RolePublishInput extends VersionInput {
  definition: RoleDefinitionDraft;
}

export type RolePreviewInput = RoleDefinitionDraft;

export interface UpgradeConflict {
  key: string;
  actionId?: string;
  reasonCode: string;
  message: string;
}

export interface UpgradeResolution {
  key: string;
  choice: UpgradeResolutionChoice;
  scopes?: ScopeExpression[];
}

export interface UpgradeInput extends VersionInput {
  newBaseRevisionId: string;
  resolutions: UpgradeResolution[];
  assignmentIds: string[];
}

export interface UpgradePreview {
  version: string;
  oldBaseRevisionId: string;
  newBaseRevisionId: string;
  conflicts: UpgradeConflict[];
  affectedAssignments: string[];
  changes: unknown[];
  impactSummary?: {
    restricted: boolean;
    affectedMembers?: number;
    affectedAssignments?: number;
  };
}

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
  description?: string;
  groupName?: string;
  kind: RoleKind;
  status: ConfigurationStatus;
}

export interface RoleRevision {
  id: string;
  roleId: string;
  revision: string;
  kind: RoleKind;
  baseRevisionId?: string;
  grants: ActionGrant[];
  deltas: RoleDelta[];
  parameterDefinitions: RoleParameterDefinition[];
  metadataOverrides?: RoleMetadataOverrides;
}

export interface RoleRevisionRef {
  kind: RoleKind;
  id: string;
}

export interface UpgradePreviewInput {
  newBaseRevisionId: string;
  resolutions?: UpgradeResolution[];
}

export interface PreviewIssue {
  path?: string;
  code?: string;
  message: string;
}

export interface ImpactSummary {
  restricted: boolean;
  affectedMembers?: number;
  affectedAssignments?: number;
  affectedDelegations?: number;
}

export interface ReferenceImpactPreview {
  affectedAssignmentIds: string[];
  impactSummary: ImpactSummary;
}

export interface Preview<T = unknown> {
  version: string;
  valid: boolean;
  errors: PreviewIssue[];
  warnings: PreviewIssue[];
  impactSummary?: ImpactSummary;
  effectiveResult?: T;
}

export interface DiagnoseInput {
  memberId?: string;
  accountId?: string;
  applicationId: string;
  actionId: string;
  targetId?: string;
}

export interface Decision {
  allowed: boolean;
  reasonCode?: string;
  message: string;
  sources: Array<{ kind?: string; id?: string; label?: string }>;
  scopeSummary?: string;
  fieldAccess?: FieldAccessMap;
  version: string;
  expiresAt: string;
}

export interface AuditEntry {
  actor?: { memberId?: string; displayName?: string };
  context?: AuthorizationContext;
  target?: { type?: string; id?: string; name?: string };
  changeType?: string;
  before?: unknown;
  after?: unknown;
  revisions?: string[];
  timestamp?: string;
  traceId?: string;
}

export interface EntitlementRecord {
  id: string;
  applicationId: string;
  applicationName?: string;
  status: ConfigurationStatus;
  source: EntitlementSource | string;
  sourceId?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface EntitlementDraft {
  applicationId: string;
  status: ConfigurationStatus;
  validFrom?: string;
  validUntil?: string;
}

export interface EntitlementReplaceInput extends VersionInput {
  entitlements: EntitlementDraft[];
}

export interface AudienceDraft {
  kind: AudienceKind;
  selection?: Selection;
  groupIds: string[];
}

export interface AudienceUpdateInput extends VersionInput {
  audience: AudienceDraft;
}

export interface ActionRecord {
  id: string;
  applicationId: string;
  resourceId: string;
  code: string;
  name: string;
  status: ConfigurationStatus;
}

export interface DirectoryDefault {
  scope: DirectoryDefaultScope;
  selection?: Selection;
}

export interface DirectoryRule {
  effect: PolicyEffect;
  viewerSelection: Selection;
  targetSelection: Selection;
}

export interface DirectoryPolicyDraft {
  defaultRevisionId: string;
  defaultOverride?: DirectoryDefault;
  rules: DirectoryRule[];
}

export interface DirectoryPolicyInput extends VersionInput {
  policy: DirectoryPolicyDraft;
}

export interface FieldRule {
  scenario: PolicyScenario;
  fieldKey: string;
  viewerSelection: Selection;
  targetScope: ScopeExpression[];
  scopeBindings: Record<string, ScopeBinding>;
  visibility: FieldVisibility;
  editable: boolean;
}

export interface FieldPolicyDraft {
  defaultRevisionId: string;
  rules: FieldRule[];
}

export interface FieldPolicyInput extends VersionInput {
  policy: FieldPolicyDraft;
}

export interface PolicyDraft {
  kind: DefaultPolicyKind;
  directory?: DirectoryPolicyDraft;
  field?: FieldPolicyDraft;
}

export interface PolicyPreviewInput {
  policyDraft: PolicyDraft;
  viewerMemberId: string;
  target?: string;
}

export interface PolicyPreviewResult {
  kind: DefaultPolicyKind;
  members: Array<ResourceDetail<MemberRecord>>;
  departments: DepartmentRecord[];
  restricted: boolean;
}

export interface AccountSelfProfile {
  accountId: string;
  username: string;
  phone?: string;
  email?: string;
  mustChangePassword: boolean;
  member: CurrentProfile;
  version: string;
}

export interface AccountSelfProfileInput extends VersionInput {
  phone?: string;
  email?: string;
}

export interface CurrentPasswordInput {
  oldPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EntitlementPreviewResult {
  entitlements: EntitlementDraft[];
  impactSummary?: Preview["impactSummary"];
}

export interface AssignmentInput {
  subject: SubjectRef;
  roleRevisionRef: RoleRevisionRef;
  scopeBindings: Record<string, ScopeBinding>;
  validFrom?: string;
  validUntil?: string;
  delegationGrantId?: string;
}

export interface AssignmentBatchInput {
  items: AssignmentInput[];
}

export interface AssignmentUpdateInput extends VersionInput {
  assignment: AssignmentInput;
}

export interface AssignmentPreviewItem {
  subject: SubjectRef;
  allowed: boolean;
  errors: PreviewIssue[];
  grants: ActionGrant[];
}

export interface AssignmentPreviewResult {
  items: AssignmentPreviewItem[];
}

export interface AssignmentRecord {
  id: string;
  assignment: AssignmentInput;
  status: GrantStatus;
  source: AssignmentSource;
}

export interface ActionScopeCeiling {
  actionId: string;
  scopes: ScopeExpression[];
  scopeBindings: Record<string, ScopeBinding>;
}

export interface DelegationInput {
  administratorMemberId: string;
  allowedRoleRevisionRefs: RoleRevisionRef[];
  recipientSelection: Selection;
  actionScopeCeilings: ActionScopeCeiling[];
  validFrom?: string;
  validUntil?: string;
  maxAssignmentDuration: string;
}

export interface DelegationUpdateInput extends VersionInput {
  delegation: DelegationInput;
}

export interface DelegationRecord {
  id: string;
  delegation: DelegationInput;
  status: GrantStatus;
}
