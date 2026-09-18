export const IAM_API_PREFIX = "/api/iam";

export const IAM_MASKED_PLACEHOLDER = "***";

export enum AuthorizationDomain {
  PLATFORM = "PLATFORM",
  TENANT = "TENANT",
}

export enum ConfigurationStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

export enum MemberStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REMOVED = "REMOVED",
}

export enum FieldVisibility {
  HIDDEN = "HIDDEN",
  MASKED = "MASKED",
  FULL = "FULL",
}

export enum SubjectType {
  MEMBER = "MEMBER",
  GROUP = "GROUP",
}

export enum ScopeKind {
  ALL = "ALL",
  SELF = "SELF",
  MEMBER_DEPARTMENTS = "MEMBER_DEPARTMENTS",
  MANAGED_DEPARTMENTS = "MANAGED_DEPARTMENTS",
  OBJECT_SET = "OBJECT_SET",
}

export enum ScopeBindingKind {
  DEPARTMENTS = "DEPARTMENTS",
  OBJECTS = "OBJECTS",
}

export enum RoleDeltaOperation {
  ADD = "ADD",
  REMOVE = "REMOVE",
  REPLACE_SCOPE = "REPLACE_SCOPE",
}

export enum RoleKind {
  SYSTEM = "SYSTEM",
  SHARED = "SHARED",
  PLATFORM_CUSTOM = "PLATFORM_CUSTOM",
  TENANT_CUSTOM = "TENANT_CUSTOM",
}

export enum ActionOriginKind {
  BASE = "BASE",
  ADDED = "ADDED",
  REMOVED = "REMOVED",
  REPLACED = "REPLACED",
}

export enum MenuKind {
  DIRECTORY = "DIRECTORY",
  PAGE = "PAGE",
}

export enum FieldScenario {
  MANAGEMENT = "MANAGEMENT",
  DIRECTORY = "DIRECTORY",
}

export enum AccountLookupPurpose {
  MEMBER_CREATE = "MEMBER_CREATE",
  ACCOUNT_MANAGE = "ACCOUNT_MANAGE",
}

export enum MenuAccessMode {
  OPEN = "OPEN",
  ACTION = "ACTION",
}

export enum MenuMatchMode {
  ANY = "ANY",
  ALL = "ALL",
}

export enum EntitlementSource {
  INITIALIZATION = "INITIALIZATION",
  MANUAL = "MANUAL",
  PLAN = "PLAN",
  MIGRATION = "MIGRATION",
}

export const IamAction = {
  TENANT_DIRECTORY_READ: "iam-tenant:directory:read",
  PLATFORM_MEMBER_READ: "iam-platform:member:read",
  PLATFORM_MEMBER_CREATE: "iam-platform:member:create",
  PLATFORM_MEMBER_UPDATE: "iam-platform:member:update",
  PLATFORM_MEMBER_STATUS: "iam-platform:member:status",
  PLATFORM_MEMBER_REMOVE: "iam-platform:member:remove",
  PLATFORM_ACCOUNT_READ: "iam-platform:account:read",
  PLATFORM_ACCOUNT_CREATE: "iam-platform:account:create",
  PLATFORM_ACCOUNT_LOOKUP: "iam-platform:account:lookup",
  PLATFORM_ACCOUNT_UPDATE: "iam-platform:account:update",
  PLATFORM_ACCOUNT_DELETE: "iam-platform:account:delete",
  PLATFORM_ACCOUNT_ENABLE: "iam-platform:account:enable",
  PLATFORM_ACCOUNT_DISABLE: "iam-platform:account:disable",
  PLATFORM_ACCOUNT_LOCK: "iam-platform:account:lock",
  PLATFORM_ACCOUNT_UNLOCK: "iam-platform:account:unlock",
  PLATFORM_ACCOUNT_RESET_PASSWORD: "iam-platform:account:reset-password",
  PLATFORM_GROUP_READ: "iam-platform:group:read",
  PLATFORM_GROUP_CREATE: "iam-platform:group:create",
  PLATFORM_GROUP_UPDATE: "iam-platform:group:update",
  PLATFORM_GROUP_DELETE: "iam-platform:group:delete",
  PLATFORM_GROUP_PREVIEW: "iam-platform:group:preview",
  PLATFORM_TENANT_READ: "iam-platform:tenant:read",
  PLATFORM_TENANT_CREATE: "iam-platform:tenant:create",
  PLATFORM_TENANT_PREVIEW: "iam-platform:tenant:preview",
  PLATFORM_TENANT_UPDATE: "iam-platform:tenant:update",
  PLATFORM_ENTITLEMENT_READ: "iam-platform:entitlement:read",
  PLATFORM_ENTITLEMENT_UPDATE: "iam-platform:entitlement:update",
  PLATFORM_ENTITLEMENT_PREVIEW: "iam-platform:entitlement:preview",
  PLATFORM_APPLICATION_READ: "iam-platform:application:read",
  PLATFORM_APPLICATION_CREATE: "iam-platform:application:create",
  PLATFORM_APPLICATION_UPDATE: "iam-platform:application:update",
  PLATFORM_APPLICATION_STATUS: "iam-platform:application:status",
  PLATFORM_APPLICATION_DELETE: "iam-platform:application:delete",
  PLATFORM_RESOURCE_READ: "iam-platform:resource:read",
  PLATFORM_RESOURCE_CREATE: "iam-platform:resource:create",
  PLATFORM_RESOURCE_UPDATE: "iam-platform:resource:update",
  PLATFORM_RESOURCE_DELETE: "iam-platform:resource:delete",
  PLATFORM_ACTION_READ: "iam-platform:action:read",
  PLATFORM_ACTION_CREATE: "iam-platform:action:create",
  PLATFORM_ACTION_UPDATE: "iam-platform:action:update",
  PLATFORM_ACTION_STATUS: "iam-platform:action:status",
  PLATFORM_ACTION_DELETE: "iam-platform:action:delete",
  PLATFORM_MENU_READ: "iam-platform:menu:read",
  PLATFORM_MENU_CREATE: "iam-platform:menu:create",
  PLATFORM_MENU_UPDATE: "iam-platform:menu:update",
  PLATFORM_MENU_DELETE: "iam-platform:menu:delete",
  PLATFORM_PLAN_READ: "iam-platform:plan:read",
  PLATFORM_PLAN_CREATE: "iam-platform:plan:create",
  PLATFORM_PLAN_UPDATE: "iam-platform:plan:update",
  PLATFORM_ROLE_READ: "iam-platform:role:read",
  PLATFORM_ROLE_CREATE: "iam-platform:role:create",
  PLATFORM_ROLE_STATUS: "iam-platform:role:status",
  PLATFORM_ROLE_DELETE: "iam-platform:role:delete",
  PLATFORM_ROLE_PUBLISH: "iam-platform:role:publish",
  PLATFORM_ROLE_PREVIEW: "iam-platform:role:preview",
  PLATFORM_SHARED_ROLE_READ: "iam-platform:shared-role:read",
  PLATFORM_SHARED_ROLE_CREATE: "iam-platform:shared-role:create",
  PLATFORM_SHARED_ROLE_STATUS: "iam-platform:shared-role:status",
  PLATFORM_SHARED_ROLE_DELETE: "iam-platform:shared-role:delete",
  PLATFORM_SHARED_ROLE_PUBLISH: "iam-platform:shared-role:publish",
  PLATFORM_SHARED_ROLE_PREVIEW: "iam-platform:shared-role:preview",
  PLATFORM_ASSIGNMENT_READ: "iam-platform:assignment:read",
  PLATFORM_ASSIGNMENT_CREATE: "iam-platform:assignment:create",
  PLATFORM_ASSIGNMENT_UPDATE: "iam-platform:assignment:update",
  PLATFORM_ASSIGNMENT_DELETE: "iam-platform:assignment:delete",
  PLATFORM_DELEGATION_READ: "iam-platform:delegation:read",
  PLATFORM_DELEGATION_CREATE: "iam-platform:delegation:create",
  PLATFORM_DELEGATION_UPDATE: "iam-platform:delegation:update",
  PLATFORM_DELEGATION_DELETE: "iam-platform:delegation:delete",
  PLATFORM_DELEGATION_PREVIEW: "iam-platform:delegation:preview",
  PLATFORM_AUTHORIZATION_DIAGNOSE: "iam-platform:authorization:diagnose",
  PLATFORM_AUDIT_READ: "iam-platform:audit:read",
  TENANT_MEMBER_READ: "iam-tenant:member:read",
  TENANT_MEMBER_CREATE: "iam-tenant:member:create",
  TENANT_MEMBER_UPDATE: "iam-tenant:member:update",
  TENANT_MEMBER_STATUS: "iam-tenant:member:status",
  TENANT_MEMBER_REMOVE: "iam-tenant:member:remove",
  TENANT_MEMBER_DEPARTMENTS: "iam-tenant:member:departments",
  TENANT_MEMBER_EXPORT: "iam-tenant:member:export",
  TENANT_DEPARTMENT_READ: "iam-tenant:department:read",
  TENANT_DEPARTMENT_CREATE: "iam-tenant:department:create",
  TENANT_DEPARTMENT_UPDATE: "iam-tenant:department:update",
  TENANT_DEPARTMENT_DELETE: "iam-tenant:department:delete",
  TENANT_SETTINGS_READ: "iam-tenant:settings:read",
  TENANT_SETTINGS_UPDATE: "iam-tenant:settings:update",
  TENANT_SETTINGS_OWNER_TRANSFER: "iam-tenant:settings:owner-transfer",
  TENANT_APPLICATION_READ: "iam-tenant:application:read",
  TENANT_AUDIENCE_READ: "iam-tenant:audience:read",
  TENANT_AUDIENCE_UPDATE: "iam-tenant:audience:update",
  TENANT_GROUP_READ: "iam-tenant:group:read",
  TENANT_GROUP_CREATE: "iam-tenant:group:create",
  TENANT_GROUP_UPDATE: "iam-tenant:group:update",
  TENANT_GROUP_DELETE: "iam-tenant:group:delete",
  TENANT_GROUP_PREVIEW: "iam-tenant:group:preview",
  TENANT_ROLE_READ: "iam-tenant:role:read",
  TENANT_ROLE_CREATE: "iam-tenant:role:create",
  TENANT_ROLE_STATUS: "iam-tenant:role:status",
  TENANT_ROLE_DELETE: "iam-tenant:role:delete",
  TENANT_ROLE_PUBLISH: "iam-tenant:role:publish",
  TENANT_ROLE_PREVIEW: "iam-tenant:role:preview",
  TENANT_ROLE_UPGRADE: "iam-tenant:role:upgrade",
  TENANT_ASSIGNMENT_READ: "iam-tenant:assignment:read",
  TENANT_ASSIGNMENT_CREATE: "iam-tenant:assignment:create",
  TENANT_ASSIGNMENT_UPDATE: "iam-tenant:assignment:update",
  TENANT_ASSIGNMENT_DELETE: "iam-tenant:assignment:delete",
  TENANT_DIRECTORY_POLICY_READ: "iam-tenant:directory-policy:read",
  TENANT_DIRECTORY_POLICY_UPDATE: "iam-tenant:directory-policy:update",
  TENANT_FIELD_POLICY_READ: "iam-tenant:field-policy:read",
  TENANT_FIELD_POLICY_UPDATE: "iam-tenant:field-policy:update",
  TENANT_POLICY_PREVIEW: "iam-tenant:policy:preview",
  TENANT_AUTHORIZATION_DIAGNOSE: "iam-tenant:authorization:diagnose",
  TENANT_AUDIT_READ: "iam-tenant:audit:read",
  TENANT_DELEGATION_READ: "iam-tenant:delegation:read",
  TENANT_DELEGATION_CREATE: "iam-tenant:delegation:create",
  TENANT_DELEGATION_UPDATE: "iam-tenant:delegation:update",
  TENANT_DELEGATION_DELETE: "iam-tenant:delegation:delete",
  TENANT_DELEGATION_PREVIEW: "iam-tenant:delegation:preview",
} as const;

export type IamActionCode = (typeof IamAction)[keyof typeof IamAction];
