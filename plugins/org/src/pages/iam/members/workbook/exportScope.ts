export interface ExportScopeDepartment {
  id: string;
  name: string;
}

export interface ExportScopeMember {
  id: string;
  name: string;
  avatar?: string;
  summary?: string;
}

export interface ExportScopeSelection {
  departments: ExportScopeDepartment[];
  members: ExportScopeMember[];
}

export interface ExportScopePage<T> {
  records: T[];
  total: number;
  size: number;
}

export interface ExportScopeLoaders {
  loadMembers: (departmentId: string, page: number) => Promise<ExportScopePage<{ id: string }>>;
  loadChildren: (departmentId: string, page: number) => Promise<ExportScopePage<{ id: string }>>;
}

export function emptyExportScope(): ExportScopeSelection {
  return { departments: [], members: [] };
}

/** 显式成员，加上所选部门及其下级部门中的成员，按成员 ID 去重。 */
export async function memberIdsForScope(
  selection: ExportScopeSelection,
  loaders: ExportScopeLoaders,
): Promise<string[]> {
  const ids = new Set(selection.members.map((member) => member.id));
  const pending = selection.departments.map((department) => department.id);
  const seen = new Set<string>();
  while (pending.length > 0) {
    const departmentId = pending.shift();
    if (!departmentId || seen.has(departmentId)) {
      continue;
    }
    seen.add(departmentId);
    for (const member of await readPages((page) => loaders.loadMembers(departmentId, page))) {
      ids.add(member.id);
    }
    for (const child of await readPages((page) => loaders.loadChildren(departmentId, page))) {
      pending.push(child.id);
    }
  }
  return [...ids];
}

async function readPages<T>(load: (page: number) => Promise<ExportScopePage<T>>): Promise<T[]> {
  const records: T[] = [];
  let page = 1;
  while (page > 0) {
    const result = await load(page);
    records.push(...result.records);
    if (
      result.records.length === 0 ||
      result.size < 1 ||
      result.records.length < result.size ||
      page * result.size >= result.total
    ) {
      break;
    }
    page += 1;
  }
  return records;
}
