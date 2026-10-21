import type {
  DepartmentSelection,
  GroupMembership,
  GroupMembershipDepartment,
  MemberDepartmentView,
  MemberPickerChanges,
} from "@ingot/admin-common";

export const MEMBERSHIP_DIRECT = "直接添加";
export const MEMBERSHIP_HIDDEN_DEPARTMENT = "部门范围";
export const MEMBERSHIP_INCLUDE_DESCENDANTS = "（含下级）";

export function formatMembershipDepartment(item: GroupMembershipDepartment): string {
  const name = item.name?.trim() || MEMBERSHIP_HIDDEN_DEPARTMENT;
  return item.includeDescendants ? `${name}${MEMBERSHIP_INCLUDE_DESCENDANTS}` : name;
}

export function formatMembershipSources(membership?: GroupMembership): string {
  if (!membership) {
    return "-";
  }
  const labels: string[] = [];
  if (membership.direct) {
    labels.push(MEMBERSHIP_DIRECT);
  }
  for (const item of membership.departments) {
    labels.push(formatMembershipDepartment(item));
  }
  return labels.length > 0 ? labels.join("、") : "-";
}

export function formatGroupSelectionSources(
  departments: DepartmentSelection[] | undefined,
  names: ReadonlyMap<string, string>,
  directMemberCount: number,
): string {
  const labels = (departments ?? []).map((item) => {
    const name = names.get(item.id)?.trim() || MEMBERSHIP_HIDDEN_DEPARTMENT;
    return item.includeDescendants ? `${name}${MEMBERSHIP_INCLUDE_DESCENDANTS}` : name;
  });
  if (directMemberCount > 0) {
    labels.push(MEMBERSHIP_DIRECT);
  }
  return labels.length > 0 ? labels.join("、") : "-";
}

export function canRemoveDirectMembership(membership?: GroupMembership): boolean {
  return membership?.direct === true;
}

export function formatVisibleDepartments(departments?: MemberDepartmentView[]): string {
  if (!departments?.length) {
    return "-";
  }
  const names = [...departments]
    .sort((left, right) => Number(right.primary) - Number(left.primary))
    .map((item) => item.name.trim())
    .filter((name) => name.length > 0);
  return names.length > 0 ? names.join("、") : "-";
}

export function applyMemberChanges(original: string[], changes: MemberPickerChanges): string[] {
  const removed = new Set(changes.removedIds);
  const next = original.filter((id) => !removed.has(id));
  for (const item of changes.added) {
    if (!next.includes(item.id)) {
      next.push(item.id);
    }
  }
  return next;
}
