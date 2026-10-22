import {
  ScopeBindingKind,
  ScopeKind,
  collectResourceFieldPermissions,
  defaultFieldDefinition,
  formatScopeKinds,
  type CurrentRoleCatalogAction,
  type CurrentRoleCreateInput,
  type CurrentRoleDefinition,
  type CurrentRoleGrantList,
  type FieldAccess,
  type FieldCapability,
  type ResourceFieldDefinition,
  type ScopeExpression,
} from "@ingot/admin-common";

const ROLE_CODE_PREFIX = "org-role-";
const ROLE_CODE_BYTES = 12;
const PARAMETER_PREFIX = "resource-";
const DEPARTMENT_PARAMETER = "departments";
const OBJECT_PARAMETER = "objects";

export const CREATE_STEPS = [
  { title: "角色信息", description: "设置角色名称等信息" },
  { title: "选择权限", description: "设置角色可以管理的权限范围" },
  { title: "设置范围", description: "设置角色可管理的数据范围" },
  { title: "字段权限", description: "配置字段可见性、编辑和筛选能力" },
  { title: "预览", description: "预览角色并确认" },
] as const;

export const GRANT_STEPS = [
  { title: "选择权限", description: "设置角色可以管理的权限范围" },
  { title: "设置范围", description: "设置角色可管理的数据范围" },
  { title: "字段权限", description: "配置字段可见性、编辑和筛选能力" },
  { title: "预览", description: "预览角色并确认" },
] as const;

export interface RoleProfile {
  name: string;
  description: string;
  groupName: string;
}

export interface SelectedGrant {
  actionId: string;
  actionName: string;
  resourceId: string;
  resourceName: string;
  applicationId: string;
  applicationName: string;
  scopes: ScopeExpression[];
  scopeCapabilities: ScopeKind[];
  fieldCapabilities?: FieldCapability[];
  fieldDefaults?: Record<string, FieldAccess>;
  fieldPermissions?: ResourceFieldDefinition;
}

export interface GrantGroup {
  applicationId: string;
  applicationName: string;
  resources: Array<{ resourceId: string; resourceName: string; grants: SelectedGrant[] }>;
}

export interface CatalogAction {
  id: string;
  name: string;
  scopeCapabilities: ScopeKind[];
}

export interface CatalogResource {
  id: string;
  name: string;
  actions: CatalogAction[];
  fieldCapabilities?: FieldCapability[];
  fieldDefaults?: Record<string, FieldAccess>;
}

export function emptyProfile(): RoleProfile {
  return { name: "", description: "", groupName: "" };
}

/** 生成仅用于入库的稳定编码，界面不展示。 */
export function createRoleCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROLE_CODE_BYTES));
  const body = [...bytes].map((item) => item.toString(16).padStart(2, "0")).join("");
  return `${ROLE_CODE_PREFIX}${body}`;
}

export function currentParameterKey(resourceId: string, kind: ScopeKind): string {
  const suffix =
    kind === ScopeKind.MANAGED_DEPARTMENTS ? DEPARTMENT_PARAMETER : OBJECT_PARAMETER;
  return `${PARAMETER_PREFIX}${resourceId}-${suffix}`;
}

export function needsParameter(kind: ScopeKind): boolean {
  return kind === ScopeKind.MANAGED_DEPARTMENTS || kind === ScopeKind.OBJECT_SET;
}

export function allowsDescendants(kind: ScopeKind): boolean {
  return kind === ScopeKind.MEMBER_DEPARTMENTS || kind === ScopeKind.MANAGED_DEPARTMENTS;
}

export function bindingKindOf(kind: ScopeKind): ScopeBindingKind | undefined {
  if (kind === ScopeKind.MANAGED_DEPARTMENTS) return ScopeBindingKind.DEPARTMENTS;
  if (kind === ScopeKind.OBJECT_SET) return ScopeBindingKind.OBJECTS;
  return undefined;
}

export function defaultScope(capabilities: ScopeKind[], resourceId = ""): ScopeExpression {
  const kind = capabilities.includes(ScopeKind.ALL)
    ? ScopeKind.ALL
    : (capabilities[0] ?? ScopeKind.ALL);
  return needsParameter(kind) && resourceId
    ? { kind, parameterKey: currentParameterKey(resourceId, kind) }
    : { kind };
}

export function formatScopeLine(scope: ScopeExpression): string {
  const label = formatScopeKinds([scope.kind]);
  if (scope.kind === ScopeKind.ALL) return `数据范围：${label}`;
  if (scope.kind === ScopeKind.MANAGED_DEPARTMENTS) {
    return `${label}：分配时选择管理部门${scope.includeDescendants ? "，含下级" : ""}`;
  }
  if (allowsDescendants(scope.kind)) {
    return `${label}：${scope.includeDescendants ? "含下级" : "仅本部门"}`;
  }
  if (scope.kind === ScopeKind.OBJECT_SET) return `${label}：分配时选择指定对象`;
  return label;
}

export function groupGrants(grants: SelectedGrant[]): GrantGroup[] {
  const apps = new Map<string, GrantGroup>();
  for (const grant of grants) {
    const app = apps.get(grant.applicationId) ?? {
      applicationId: grant.applicationId,
      applicationName: grant.applicationName,
      resources: [],
    };
    let resource = app.resources.find((item) => item.resourceId === grant.resourceId);
    if (!resource) {
      resource = { resourceId: grant.resourceId, resourceName: grant.resourceName, grants: [] };
      app.resources.push(resource);
    }
    resource.grants.push(grant);
    apps.set(grant.applicationId, app);
  }
  return [...apps.values()];
}

export function mergeCatalog(
  current: CatalogResource[],
  actions: CurrentRoleCatalogAction[],
): CatalogResource[] {
  const resources = new Map(
    current.map((item) => [item.id, { ...item, actions: [...item.actions] }]),
  );
  for (const action of actions) {
    const resource: CatalogResource = resources.get(action.resourceId) ?? {
      id: action.resourceId,
      name: action.resourceName,
      actions: [],
      fieldCapabilities: action.fieldCapabilities,
      fieldDefaults: action.fieldDefaults,
    };
    if (!resource.fieldCapabilities?.length && action.fieldCapabilities?.length) {
      resource.fieldCapabilities = action.fieldCapabilities;
      resource.fieldDefaults = action.fieldDefaults;
    }
    if (!resource.actions.some((item) => item.id === action.actionId)) {
      resource.actions.push({
        id: action.actionId,
        name: action.actionName,
        scopeCapabilities: [...action.scopeCapabilities],
      });
    }
    resources.set(action.resourceId, resource);
  }
  return [...resources.values()];
}

export function toCurrentDefinition(grants: SelectedGrant[]): CurrentRoleDefinition {
  const parameters = new Map<string, CurrentRoleDefinition["parameterDefinitions"][number]>();
  for (const grant of grants) {
    for (const scope of grant.scopes) {
      const kind = bindingKindOf(scope.kind);
      const key = scope.parameterKey?.trim();
      if (!kind || !key || !grant.resourceId) continue;
      parameters.set(key, { key, kind, resourceId: grant.resourceId });
    }
  }
  const resourceFieldPermissions = collectResourceFieldPermissions(grants);
  return {
    grants: grants.map((item) => ({
      actionId: item.actionId,
      scopes: item.scopes.map((scope) => ({ ...scope })),
    })),
    parameterDefinitions: [...parameters.values()],
    ...(resourceFieldPermissions ? { resourceFieldPermissions } : {}),
  };
}

export function toCreateInput(
  profile: RoleProfile,
  code: string,
  grants: SelectedGrant[],
): CurrentRoleCreateInput {
  return {
    code,
    name: profile.name.trim(),
    description: profile.description.trim() || undefined,
    groupName: profile.groupName.trim() || undefined,
    definition: toCurrentDefinition(grants),
  };
}

export function selectedGrantsOf(list: CurrentRoleGrantList): SelectedGrant[] {
  const scopesOf = new Map(list.definition.grants.map((grant) => [grant.actionId, grant.scopes]));
  return list.items.map((item) => {
    const saved = scopesOf.get(item.actionId) ?? [];
    return {
      actionId: item.actionId,
      actionName: item.actionName,
      resourceId: item.resourceId,
      resourceName: item.resourceName,
      applicationId: item.applicationId,
      applicationName: item.applicationName,
      scopes: saved.length
        ? saved.map((scope) => ({ ...scope }))
        : [defaultScope(item.scopeCapabilities, item.resourceId)],
      scopeCapabilities: item.scopeCapabilities,
      fieldCapabilities: item.fieldCapabilities,
      fieldDefaults: item.fieldDefaults,
      fieldPermissions:
        list.definition.resourceFieldPermissions?.[item.resourceId] ??
        (item.fieldCapabilities?.length ? defaultFieldDefinition(item.fieldDefaults) : undefined),
    };
  });
}

export function grantsFingerprint(grants: SelectedGrant[]): string {
  return JSON.stringify(
    grants.map((item) => ({
      actionId: item.actionId,
      scopes: item.scopes,
      fieldPermissions: item.fieldPermissions,
    })),
  );
}
