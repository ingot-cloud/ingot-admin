import {
  RoleKind,
  ScopeBindingKind,
  ScopeKind,
  formatScopeKinds,
  type RoleCreateInput,
  type RoleParameterDefinition,
  type ScopeExpression,
} from "@ingot/admin-common";

export const WIZARD_STEPS = [
  { title: "角色信息", description: "设置角色名称等信息" },
  { title: "选择权限", description: "设置角色可以管理的权限范围" },
  { title: "设置范围", description: "设置角色可管理的数据范围" },
  { title: "预览", description: "预览角色并确认" },
] as const;

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

export function defaultScope(capabilities: ScopeKind[]): ScopeExpression {
  const kind = capabilities.includes(ScopeKind.ALL)
    ? ScopeKind.ALL
    : (capabilities[0] ?? ScopeKind.ALL);
  return { kind };
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
    .filter((item) => item.scopes.some((scope) => needsParameter(scope.kind) && !scope.parameterKey?.trim()))
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
  if (allowsDescendants(scope.kind)) {
    return `${label}：${scope.includeDescendants ? "含下级" : "仅本部门"}`;
  }
  if (scope.parameterKey?.trim()) {
    return `${label}：${scope.parameterKey.trim()}`;
  }
  return label;
}

export function toCreateInput(profile: WizardProfile, grants: SelectedGrant[]): RoleCreateInput {
  return {
    code: profile.code.trim(),
    name: profile.name.trim(),
    description: profile.description.trim() || undefined,
    groupName: profile.groupName.trim() || undefined,
    kind: RoleKind.SHARED,
    definition: {
      grants: grants.map((item) => ({
        actionId: item.actionId,
        scopes: item.scopes.map((scope) => ({ ...scope })),
      })),
      deltas: [],
      parameterDefinitions: collectParameters(grants),
    },
  };
}

export function profileDirty(profile: WizardProfile): boolean {
  return Boolean(
    profile.code.trim() ||
      profile.name.trim() ||
      profile.description.trim() ||
      profile.groupName.trim(),
  );
}
