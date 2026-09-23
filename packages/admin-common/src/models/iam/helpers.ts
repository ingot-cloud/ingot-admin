import type { Page } from "@ingot/admin-core";
import {
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  IAM_MASKED_PLACEHOLDER,
  FieldVisibility,
  RoleDeltaOperation,
  ScopeKind,
  SubjectType,
  UpgradeResolutionChoice,
} from "./constants";
import type {
  ActionGrant,
  AssignmentInput,
  DepartmentRecord,
  EntitlementRecord,
  FieldAccessMap,
  IamPageResponse,
  MenuTreeRow,
  ResourceDetail,
  RoleDefinitionDraft,
  RoleDelta,
  RoleRevision,
  ScopeExpression,
  Selection,
  UpgradeConflict,
  UpgradeResolution,
} from "./types";

export interface DepartmentTreeNode {
  id: string;
  name: string;
  children?: DepartmentTreeNode[];
}

export function isMaskedValue(value: unknown): boolean {
  return value === IAM_MASKED_PLACEHOLDER;
}

export function isFieldVisible(access: FieldAccessMap | undefined, key: string): boolean {
  const item = access?.[key];
  if (!item) {
    return true;
  }
  return item.visibility !== FieldVisibility.HIDDEN;
}

export function isFieldEditable(access: FieldAccessMap | undefined, key: string): boolean {
  const item = access?.[key];
  return item?.visibility === FieldVisibility.FULL && item.editable === true;
}

export function editablePatch<T extends object>(
  draft: T,
  access: FieldAccessMap | undefined,
  editedKeys: ReadonlyArray<keyof T & string>,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of editedKeys) {
    if (!isFieldEditable(access, key)) {
      continue;
    }
    const value = draft[key];
    if (isMaskedValue(value)) {
      continue;
    }
    patch[key] = value;
  }
  return patch;
}

export function toIamListParams(
  page: Page,
  condition?: object,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page: page.current ?? 1,
    pageSize: page.size ?? IAM_DEFAULT_PAGE_SIZE,
  };
  if (!condition) {
    return params;
  }
  for (const [key, value] of Object.entries(condition)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params[key] = value;
  }
  return params;
}

export function mapIamPage<T>(data: IamPageResponse<T> | undefined | null): Page<T> {
  return {
    current: data?.page ?? 1,
    size: data?.pageSize ?? IAM_DEFAULT_PAGE_SIZE,
    total: data?.total ?? 0,
    records: data?.items ?? [],
  };
}

/**
 * 按契约默认页大小逐页拉完列表，避免把单页上限当「查全部」。
 */
export async function collectIamPageRecords<T>(
  fetchPage: (page: Page) => Promise<{ data: Page<T> }>,
  size = IAM_DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const records: T[] = [];
  let current = 1;
  let total = Number.POSITIVE_INFINITY;
  while (records.length < total) {
    const { data } = await fetchPage({ current, size });
    const chunk = data?.records ?? [];
    total = data?.total ?? 0;
    records.push(...chunk);
    if (chunk.length === 0 || chunk.length < size || records.length >= total) {
      break;
    }
    current += 1;
  }
  return records;
}

/**
 * 复现开通集合指纹 {@code applicationId:version:enabled}，无开通时为 {@code 0}。
 */
export function entitlementCollectionVersion(
  items: Array<ResourceDetail<EntitlementRecord>>,
): string {
  if (items.length === 0) {
    return "0";
  }
  return [...items]
    .sort((left, right) =>
      left.record.applicationId.localeCompare(right.record.applicationId, undefined, { numeric: true }),
    )
    .map((item) => {
      const enabled = item.record.status === ConfigurationStatus.ENABLED ? "1" : "0";
      return `${item.record.applicationId}:${item.version}:${enabled}`;
    })
    .join("|");
}

export function buildDepartmentTree(records: DepartmentRecord[]): DepartmentTreeNode[] {
  const nodes = new Map<string, DepartmentTreeNode>();
  for (const record of records) {
    nodes.set(record.id, { id: record.id, name: record.name });
  }
  const roots: DepartmentTreeNode[] = [];
  const ordered = [...records].sort((left, right) => left.sortOrder - right.sortOrder);
  for (const record of ordered) {
    const node = nodes.get(record.id);
    if (!node) {
      continue;
    }
    const parent = record.parentId ? nodes.get(record.parentId) : undefined;
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children = parent.children ?? [];
    parent.children.push(node);
  }
  return roots;
}

export function emptySelectionDepartments(): [] {
  return [];
}

export function emptySelection(): Selection {
  return { members: [], departments: [] };
}

export const IAM_OBJECT_ACTION_DENIED_MESSAGE = "当前对象不允许该操作";

/**
 * 对象级能力只解释「这一条」能不能做。
 * 列表未返回该操作码时不视为越界，是否展示由会话 actionCodes 决定。
 */
export function objectActionAllowed(
  capabilities: Record<string, { allowed?: boolean; message?: string }> | undefined,
  actionCode: string,
): { allowed: boolean; message?: string } {
  const item = capabilities?.[actionCode];
  if (!item) {
    return { allowed: true };
  }
  if (item.allowed === true) {
    return { allowed: true, message: item.message };
  }
  const message = item.message?.trim();
  return {
    allowed: false,
    message: message || IAM_OBJECT_ACTION_DENIED_MESSAGE,
  };
}

export function resolveIamActionAccess(
  actionCode: string,
  options: {
    hasAction: boolean;
    capabilities?: Record<string, { allowed?: boolean; message?: string }>;
  },
): { visible: boolean; allowed: boolean; message?: string } {
  if (!options.hasAction) {
    return { visible: false, allowed: false };
  }
  const object = objectActionAllowed(options.capabilities, actionCode);
  return {
    visible: true,
    allowed: object.allowed,
    message: object.message,
  };
}

export function emptyRoleDefinitionDraft(): RoleDefinitionDraft {
  return {
    grants: [],
    deltas: [],
    parameterDefinitions: [],
  };
}

function scopeFingerprint(scopes?: ScopeExpression[]): string {
  return JSON.stringify(
    [...(scopes ?? [])]
      .map((item) => ({
        kind: item.kind,
        parameterKey: item.parameterKey ?? "",
        includeDescendants: Boolean(item.includeDescendants),
      }))
      .sort((left, right) => {
        const kind = left.kind.localeCompare(right.kind);
        return kind !== 0 ? kind : left.parameterKey.localeCompare(right.parameterKey);
      }),
  );
}

function grantDeltas(current: ActionGrant[], previous: ActionGrant[]): RoleDelta[] {
  const prevMap = new Map(previous.map((item) => [item.actionId, item]));
  const currMap = new Map(current.map((item) => [item.actionId, item]));
  const deltas: RoleDelta[] = [];
  for (const grant of current) {
    const older = prevMap.get(grant.actionId);
    if (!older) {
      deltas.push({
        actionId: grant.actionId,
        operation: RoleDeltaOperation.ADD,
        scopes: grant.scopes,
      });
      continue;
    }
    if (scopeFingerprint(older.scopes) !== scopeFingerprint(grant.scopes)) {
      deltas.push({
        actionId: grant.actionId,
        operation: RoleDeltaOperation.REPLACE_SCOPE,
        scopes: grant.scopes,
      });
    }
  }
  for (const grant of previous) {
    if (!currMap.has(grant.actionId)) {
      deltas.push({
        actionId: grant.actionId,
        operation: RoleDeltaOperation.REMOVE,
        scopes: grant.scopes,
      });
    }
  }
  return deltas;
}

/** 版本历史展示用差异：定制角色用 deltas，完整定义角色按相邻版本授权计算。 */
export function revisionDisplayDeltas(current: RoleRevision, previous?: RoleRevision): RoleDelta[] {
  if (current.deltas?.length) {
    return current.deltas;
  }
  if (!previous) {
    return [];
  }
  return grantDeltas(current.grants ?? [], previous.grants ?? []);
}

/** 冲突未选处置，或替换范围未带 scopes 时不可提交升级。 */
export function unresolvedUpgradeKeys(
  conflicts: UpgradeConflict[],
  resolutions: UpgradeResolution[],
): string[] {
  return conflicts
    .filter((item) => {
      const resolution = resolutions.find((entry) => entry.key === item.key);
      if (!resolution) {
        return true;
      }
      if (resolution.choice === UpgradeResolutionChoice.REPLACE_SCOPE) {
        return !resolution.scopes?.length;
      }
      return false;
    })
    .map((item) => item.key);
}

/** 同一角色版本/范围/期限下，按接收对象展开原子批次。 */
export function toAssignmentBatchItems(
  subjectType: SubjectType,
  subjectIds: string[],
  template: Omit<AssignmentInput, "subject">,
): AssignmentInput[] {
  return subjectIds
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => ({
      ...template,
      subject: { type: subjectType, id },
    }));
}

export interface IamSelectOption {
  id: string;
  name: string;
}

/** 已解析的操作，用于把授权里的操作 ID 显示成应用名和操作名。 */
export interface IamActionRef {
  id: string;
  name: string;
  applicationId: string;
  applicationName: string;
}

export function toIamSelectRecords<T extends { id: string; name?: string; displayName?: string }>(
  page: Page<ResourceDetail<T>>,
): Page<IamSelectOption> {
  return {
    ...page,
    records: (page.records ?? []).map((item) => ({
      id: item.record.id,
      name: item.record.displayName ?? item.record.name ?? item.record.id,
    })),
  };
}

export interface MenuTreeFilter {
  name?: string;
  kind?: string;
  matchMode?: string;
  accessMode?: string;
}

export function flattenMenuTree(nodes: MenuTreeRow[]): MenuTreeRow[] {
  const rows: MenuTreeRow[] = [];
  const walk = (items: MenuTreeRow[]): void => {
    for (const item of items) {
      rows.push(item);
      if (item.children?.length) {
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return rows;
}

export function filterMenuTree(nodes: MenuTreeRow[], filter: MenuTreeFilter): MenuTreeRow[] {
  const name = filter.name?.trim();
  return nodes.flatMap((node) => {
    const children = filterMenuTree(node.children ?? [], filter);
    const matched =
      (!name || node.record.name.includes(name)) &&
      (!filter.kind || node.record.kind === filter.kind) &&
      (!filter.matchMode || node.record.matchMode === filter.matchMode) &&
      (!filter.accessMode || node.record.accessMode === filter.accessMode);
    if (!matched && children.length === 0) {
      return [];
    }
    return [{ ...node, children }];
  });
}

export function formatScopeKinds(kinds: readonly ScopeKind[]): string {
  if (!kinds.length) {
    return "未声明";
  }
  const labels: Record<ScopeKind, string> = {
    [ScopeKind.ALL]: "全部",
    [ScopeKind.SELF]: "本人",
    [ScopeKind.MEMBER_DEPARTMENTS]: "所在部门",
    [ScopeKind.MANAGED_DEPARTMENTS]: "管理部门",
    [ScopeKind.OBJECT_SET]: "指定对象",
  };
  return kinds.map((kind) => labels[kind] ?? kind).join("、");
}
