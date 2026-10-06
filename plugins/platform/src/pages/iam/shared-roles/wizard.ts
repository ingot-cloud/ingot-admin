import {
  RoleKind,
  FieldVisibility,
  ScopeBindingKind,
  ScopeKind,
  formatScopeKinds,
  type RoleCreateInput,
  type FieldAccess,
  type FieldCapability,
  type RoleDefinitionDraft,
  type RoleParameterDefinition,
  type RolePublishInput,
  type ScopeExpression,
} from "@ingot/admin-common";

export const WIZARD_STEPS = [
  { title: "角色信息", description: "设置角色名称等信息" },
  { title: "选择权限", description: "设置角色可以管理的权限范围" },
  { title: "设置范围", description: "设置角色可管理的数据范围" },
  { title: "预览", description: "预览角色并确认" },
] as const;

export const GRANT_WIZARD_STEPS = WIZARD_STEPS.slice(1);
export const PLATFORM_WIZARD_STEPS = [
  ...WIZARD_STEPS.slice(0, 3),
  { title: "字段权限", description: "配置资源字段可见性和可编辑能力" },
  WIZARD_STEPS[3],
];

export interface WizardProfile {
  code: string;
  name: string;
  description: string;
  groupName: string;
}

export interface SelectedGrant {
  actionId: string;
  actionCode: string;
  actionName: string;
  resourceId: string;
  resourceName: string;
  applicationId: string;
  applicationName: string;
  scopes: ScopeExpression[];
  scopeCapabilities: ScopeKind[];
  fieldCapabilities?: FieldCapability[];
  fieldDefaults?: Record<string, FieldAccess>;
  fieldPermissions?: Record<string, FieldAccess>;
}

export interface GrantGroup {
  applicationId: string;
  applicationName: string;
  resources: Array<{
    resourceId: string;
    resourceName: string;
    grants: SelectedGrant[];
  }>;
}

export function emptyWizardProfile(): WizardProfile {
  return { code: "", name: "", description: "", groupName: "" };
}

export function isReadAction(code: string): boolean {
  return code.endsWith(":read");
}

export function parameterKeyFor(resourceId: string, kind: ScopeKind): string {
  return `${kind === ScopeKind.MANAGED_DEPARTMENTS ? "departments" : "objects"}_${resourceId}`;
}

export function defaultScope(capabilities: ScopeKind[], resourceId = ""): ScopeExpression {
  const kind = capabilities.includes(ScopeKind.ALL)
    ? ScopeKind.ALL
    : (capabilities[0] ?? ScopeKind.ALL);
  return needsParameter(kind) && resourceId
    ? { kind, parameterKey: parameterKeyFor(resourceId, kind) }
    : { kind };
}

export function needsParameter(kind: ScopeKind): boolean {
  return kind === ScopeKind.MANAGED_DEPARTMENTS || kind === ScopeKind.OBJECT_SET;
}

export function allowsDescendants(kind: ScopeKind): boolean {
  return kind === ScopeKind.MEMBER_DEPARTMENTS || kind === ScopeKind.MANAGED_DEPARTMENTS;
}

export function bindingKindOf(kind: ScopeKind): ScopeBindingKind | undefined {
  if (kind === ScopeKind.MANAGED_DEPARTMENTS) {
    return ScopeBindingKind.DEPARTMENTS;
  }
  if (kind === ScopeKind.OBJECT_SET) {
    return ScopeBindingKind.OBJECTS;
  }
  return undefined;
}

export function collectParameters(grants: SelectedGrant[]): RoleParameterDefinition[] {
  const rows = new Map<string, ScopeBindingKind>();
  for (const grant of grants) {
    for (const scope of grant.scopes) {
      const kind = bindingKindOf(scope.kind);
      const key = scope.parameterKey?.trim();
      if (!kind || !key) {
        continue;
      }
      rows.set(key, kind);
    }
  }
  return [...rows.entries()].map(([key, kind]) => ({ key, kind }));
}

export function missingParameterKeys(grants: SelectedGrant[]): string[] {
  return grants
    .filter((item) =>
      item.scopes.some((scope) => needsParameter(scope.kind) && !scope.parameterKey?.trim()),
    )
    .map((item) => item.actionName || item.actionId);
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
      resource = {
        resourceId: grant.resourceId,
        resourceName: grant.resourceName,
        grants: [],
      };
      app.resources.push(resource);
    }
    resource.grants.push(grant);
    apps.set(grant.applicationId, app);
  }
  return [...apps.values()];
}

export function formatScopeLine(scope: ScopeExpression): string {
  const label = formatScopeKinds([scope.kind]);
  if (scope.kind === ScopeKind.ALL) {
    return `部门范围：${label}`;
  }
  if (scope.kind === ScopeKind.MANAGED_DEPARTMENTS) {
    return `${label}：分配时选择管理部门${scope.includeDescendants ? "，含下级" : ""}`;
  }
  if (allowsDescendants(scope.kind)) {
    return `${label}：${scope.includeDescendants ? "含下级" : "仅本部门"}`;
  }
  if (scope.kind === ScopeKind.OBJECT_SET) {
    return `${label}：分配时选择指定对象`;
  }
  return label;
}

export function toDefinition(grants: SelectedGrant[]): RoleDefinitionDraft {
  return {
    grants: grants.map((item) => ({
      actionId: item.actionId,
      scopes: item.scopes.map((scope) => ({ ...scope })),
    })),
    deltas: [],
    parameterDefinitions: collectParameters(grants),
    ...(grants.some((grant) => (grant.fieldCapabilities?.length ?? 0) > 0)
      ? {
          resourceFieldPermissions: Object.fromEntries(
            [
              ...new Map(
                grants
                  .filter((grant) => (grant.fieldCapabilities?.length ?? 0) > 0)
                  .map((grant) => [grant.resourceId, grant]),
              ).values(),
            ].map((grant) => [
              grant.resourceId,
              Object.fromEntries(
                (grant.fieldCapabilities ?? []).map((field) => [
                  field.key,
                  grant.fieldPermissions?.[field.key] ??
                    grant.fieldDefaults?.[field.key] ?? {
                      visibility: FieldVisibility.HIDDEN,
                      editable: false,
                    },
                ]),
              ),
            ]),
          ),
        }
      : {}),
  };
}

export function toCreateInput(
  profile: WizardProfile,
  grants: SelectedGrant[],
  kind = RoleKind.SHARED,
): RoleCreateInput {
  if (kind === RoleKind.SYSTEM) throw new Error("不能创建系统治理角色");
  return {
    code: profile.code.trim(),
    name: profile.name.trim(),
    description: profile.description.trim() || undefined,
    groupName: profile.groupName.trim() || undefined,
    kind,
    definition: toDefinition(grants),
  };
}

export function toPublishInput(expectedVersion: string, grants: SelectedGrant[]): RolePublishInput {
  return {
    expectedVersion,
    definition: toDefinition(grants),
  };
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

export function profileDirty(profile: WizardProfile): boolean {
  return Boolean(
    profile.code.trim() ||
    profile.name.trim() ||
    profile.description.trim() ||
    profile.groupName.trim(),
  );
}
