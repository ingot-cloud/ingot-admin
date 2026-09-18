import type { Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE, IAM_MASKED_PLACEHOLDER, FieldVisibility } from "./constants";
import type { DepartmentRecord, FieldAccessMap, IamPageResponse } from "./types";

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
