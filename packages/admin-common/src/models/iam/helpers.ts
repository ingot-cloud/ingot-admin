import type { Page } from "@ingot/admin-core";
import {
  IAM_DEFAULT_PAGE_SIZE,
  IAM_MASKED_PLACEHOLDER,
  FieldVisibility,
  ScopeKind,
  SubjectType,
  UpgradeResolutionChoice,
} from "./constants";
import type {
  AssignmentInput,
  DepartmentRecord,
  FieldAccessMap,
  IamPageResponse,
  ResourceDetail,
  RoleDefinitionDraft,
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
  return {
    page: page.current ?? 1,
    pageSize: page.size ?? IAM_DEFAULT_PAGE_SIZE,
    ...condition,
  };
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

export function objectActionAllowed(
  capabilities: Record<string, { allowed?: boolean; message?: string }> | undefined,
  actionCode: string,
): { allowed: boolean; message?: string } {
  const item = capabilities?.[actionCode];
  return {
    allowed: item?.allowed === true,
    message: item?.message,
  };
}

export function emptyRoleDefinitionDraft(): RoleDefinitionDraft {
  return {
    grants: [],
    deltas: [],
    parameterDefinitions: [],
  };
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
