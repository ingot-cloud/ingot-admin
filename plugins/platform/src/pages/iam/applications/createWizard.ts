import {
  ConfigurationStatus,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  ScopeKind,
  type AppActionRecord,
  type ApplicationBundleDraft,
  type AppMenuDraft,
  type AppResourceRecord,
  type AuthorizationDomain,
  type FieldCapability,
  type MenuTreeRow,
  type ResourceDetail,
} from "@ingot/admin-common";
import { ACTION_CODE_SEPARATOR, actionCodePrefix } from "./actionCode";
import type { MenuActionOption } from "./menuActions";

export const APP_WIZARD_STEPS = [
  { title: "基础信息", description: "设置应用编码和名称" },
  { title: "资源与操作", description: "声明资源及其操作" },
  { title: "菜单", description: "配置菜单与准入" },
  { title: "预览创建", description: "确认后创建应用" },
] as const;

export interface AppWizardProfile {
  code: string;
  name: string;
  description: string;
  icon?: string;
  sortOrder: number;
  baseline: boolean;
}

export interface DraftAction {
  tempId: string;
  code: string;
  name: string;
}

export interface DraftResource {
  tempId: string;
  code: string;
  name: string;
  scopeCapabilities: ScopeKind[];
  fieldCapabilities: FieldCapability[];
  actions: DraftAction[];
}

export interface DraftMenu {
  tempId: string;
  parentTempId?: string;
  name: string;
  kind: MenuKind;
  path?: string;
  viewPath?: string;
  icon?: string;
  accessMode: MenuAccessMode;
  matchMode: MenuMatchMode;
  actionTempIds: string[];
  sortOrder: number;
}

let draftSeq = 0;

export function nextDraftId(prefix: string): string {
  draftSeq += 1;
  return `${prefix}-${draftSeq}`;
}

export function resetDraftIds(): void {
  draftSeq = 0;
}

export function emptyAppProfile(): AppWizardProfile {
  return { code: "", name: "", description: "", icon: undefined, sortOrder: 0, baseline: false };
}

export function emptyDraftResource(): DraftResource {
  return {
    tempId: nextDraftId("resource"),
    code: "",
    name: "",
    scopeCapabilities: [ScopeKind.ALL],
    fieldCapabilities: [],
    actions: [],
  };
}

export function emptyDraftAction(): DraftAction {
  return { tempId: nextDraftId("action"), code: "", name: "" };
}

export function emptyDraftMenu(): DraftMenu {
  return {
    tempId: nextDraftId("menu"),
    name: "",
    kind: MenuKind.PAGE,
    accessMode: MenuAccessMode.ACTION,
    matchMode: MenuMatchMode.ANY,
    actionTempIds: [],
    sortOrder: 0,
  };
}

export function profileDirty(profile: AppWizardProfile): boolean {
  return Boolean(
    profile.code || profile.name || profile.description || profile.icon || profile.sortOrder || profile.baseline,
  );
}

export function catalogDirty(resources: DraftResource[], menus: DraftMenu[]): boolean {
  return resources.length > 0 || menus.length > 0;
}

export function profileError(profile: AppWizardProfile): string | undefined {
  if (!profile.code.trim() || !profile.name.trim()) {
    return "请填写编码和名称";
  }
  return undefined;
}

export function catalogError(resources: DraftResource[]): string | undefined {
  const codes = resources.map((item) => item.code.trim());
  if (new Set(codes).size !== codes.length) {
    return "资源编码不能重复";
  }
  for (const resource of resources) {
    if (!resource.code.trim() || !resource.name.trim()) {
      return "请填写资源编码和名称";
    }
    const actionCodes = resource.actions.map((item) => item.code.trim());
    if (new Set(actionCodes).size !== actionCodes.length) {
      return `资源 ${resource.name || resource.code} 的操作编码不能重复`;
    }
    for (const action of resource.actions) {
      if (!action.code.trim() || !action.name.trim()) {
        return "请填写操作编码和名称";
      }
      if (action.code.includes("*") || action.code.includes(ACTION_CODE_SEPARATOR)) {
        return "操作码末段不得包含通配符或冒号";
      }
    }
  }
  return undefined;
}

export function menuError(menus: DraftMenu[]): string | undefined {
  for (const menu of menus) {
    if (!menu.name.trim()) {
      return "请填写菜单名称";
    }
  }
  return undefined;
}

export function previewActionCode(applicationCode: string, resourceCode: string, local: string): string {
  return `${actionCodePrefix(applicationCode, resourceCode)}${local}`;
}

export const DRAFT_APPLICATION_ID = "draft-application";

export function catalogActionsOf(profile: AppWizardProfile, resources: DraftResource[]): MenuActionOption[] {
  return resources.flatMap((resource) =>
    resource.actions.map((action) => ({
      id: action.tempId,
      name: action.name,
      code: previewActionCode(profile.code, resource.code, action.code),
      resourceId: resource.tempId,
      resourceName: resource.name || resource.code,
      applicationId: DRAFT_APPLICATION_ID,
      applicationName: profile.name || profile.code || "当前应用",
    })),
  );
}

const emptyMeta = (): Pick<ResourceDetail<AppResourceRecord>, "fieldAccess" | "capabilities" | "version"> => ({
  fieldAccess: {},
  capabilities: {},
  version: "0",
});

export function asResourceDetail(resource: DraftResource): ResourceDetail<AppResourceRecord> {
  return {
    record: {
      id: resource.tempId,
      applicationId: DRAFT_APPLICATION_ID,
      code: resource.code,
      name: resource.name,
      scopeCapabilities: resource.scopeCapabilities,
      fieldCapabilities: resource.fieldCapabilities,
      status: ConfigurationStatus.ENABLED,
    },
    ...emptyMeta(),
  };
}

export function asActionDetail(
  resource: DraftResource,
  action: DraftAction,
  profile: AppWizardProfile,
): ResourceDetail<AppActionRecord> {
  return {
    record: {
      id: action.tempId,
      applicationId: DRAFT_APPLICATION_ID,
      resourceId: resource.tempId,
      code: previewActionCode(profile.code, resource.code, action.code) || action.code,
      name: action.name,
      status: ConfigurationStatus.ENABLED,
    },
    ...emptyMeta(),
  };
}

export function menusToTree(menus: DraftMenu[]): MenuTreeRow[] {
  const byParent = new Map<string, DraftMenu[]>();
  for (const menu of menus) {
    const key = menu.parentTempId ?? "";
    const list = byParent.get(key) ?? [];
    list.push(menu);
    byParent.set(key, list);
  }
  const toRow = (menu: DraftMenu): MenuTreeRow => ({
    record: {
      id: menu.tempId,
      applicationId: DRAFT_APPLICATION_ID,
      parentId: menu.parentTempId,
      name: menu.name,
      kind: menu.kind,
      path: menu.path,
      viewPath: menu.viewPath,
      icon: menu.icon,
      accessMode: menu.accessMode,
      matchMode: menu.matchMode,
      actionIds: [...menu.actionTempIds],
      sortOrder: menu.sortOrder,
      status: ConfigurationStatus.ENABLED,
    },
    children: (byParent.get(menu.tempId) ?? []).map(toRow),
    ...emptyMeta(),
  });
  return (byParent.get("") ?? []).map(toRow);
}

export function upsertDraftMenu(menus: DraftMenu[], draft: AppMenuDraft, targetId?: string): DraftMenu[] {
  const next: DraftMenu = {
    tempId: targetId ?? nextDraftId("menu"),
    parentTempId: draft.parentId,
    name: draft.name.trim(),
    kind: draft.kind,
    path: draft.path,
    viewPath: draft.viewPath,
    icon: draft.icon,
    accessMode: draft.accessMode,
    matchMode: draft.matchMode,
    actionTempIds: draft.accessMode === MenuAccessMode.OPEN ? [] : [...draft.actionIds],
    sortOrder: draft.sortOrder,
  };
  if (!targetId) {
    return [...menus, next];
  }
  return menus.map((item) => (item.tempId === targetId ? next : item));
}

export function toApplicationBundle(
  profile: AppWizardProfile,
  domain: AuthorizationDomain,
  resources: DraftResource[],
  menus: DraftMenu[],
): ApplicationBundleDraft {
  return {
    application: {
      code: profile.code.trim(),
      domain,
      name: profile.name.trim(),
      description: profile.description.trim() || undefined,
      icon: profile.icon || undefined,
      sortOrder: profile.sortOrder,
      baseline: profile.baseline,
    },
    resources: resources.map((resource) => ({
      tempId: resource.tempId,
      code: resource.code.trim(),
      name: resource.name.trim(),
      scopeCapabilities: resource.scopeCapabilities,
      fieldCapabilities: resource.fieldCapabilities,
      actions: resource.actions.map((action) => ({
        tempId: action.tempId,
        code: action.code.trim(),
        name: action.name.trim(),
      })),
    })),
    menus: orderedMenus(menus).map((menu) => ({
      tempId: menu.tempId,
      parentTempId: menu.parentTempId,
      name: menu.name.trim(),
      kind: menu.kind,
      path: menu.path || undefined,
      viewPath: menu.viewPath || undefined,
      icon: menu.icon || undefined,
      accessMode: menu.accessMode,
      matchMode: menu.matchMode,
      actionTempIds: menu.accessMode === MenuAccessMode.OPEN ? [] : [...menu.actionTempIds],
      sortOrder: menu.sortOrder,
    })),
  };
}

export function orderedMenus(menus: DraftMenu[]): DraftMenu[] {
  const byParent = new Map<string, DraftMenu[]>();
  for (const menu of menus) {
    const key = menu.parentTempId ?? "";
    const list = byParent.get(key) ?? [];
    list.push(menu);
    byParent.set(key, list);
  }
  const result: DraftMenu[] = [];
  const visit = (parentId: string): void => {
    for (const menu of byParent.get(parentId) ?? []) {
      result.push(menu);
      visit(menu.tempId);
    }
  };
  visit("");
  for (const menu of menus) {
    if (!result.includes(menu)) {
      result.push(menu);
    }
  }
  return result;
}
