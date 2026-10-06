import {
  type AssignmentRecord,
  type AuthorizationOption,
  type MemberRoleChanges,
  type ResourceDetail,
  type PlatformAssignmentRoleDraft,
} from "@ingot/admin-common";

/** 保留已加载记录，差量保存从不推断未加载记录应被撤销。 */
export interface MemberRoleEditorState {
  stored: ResourceDetail<AssignmentRecord>[];
  roles: PlatformAssignmentRoleDraft[];
  removed: string[];
  validFrom?: string;
  validUntil?: string;
}
export const emptyMemberRoleState = (): MemberRoleEditorState => ({
  stored: [],
  roles: [],
  removed: [],
});
export const memberAssignmentKey = (id: string): string => `assignment:${id}`;
export const memberRoleLabel = (option: AuthorizationOption): string =>
  option.roleNode ? `${option.roleNode.roleName} · ${option.roleNode.name}` : option.name;
const orderedBindings = (bindings: PlatformAssignmentRoleDraft["bindings"]): string =>
  JSON.stringify(
    Object.entries(bindings)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value.kind, [...value.ids].sort()]),
  );
export function memberRoleChanges(state: MemberRoleEditorState): MemberRoleChanges {
  const existing = new Map(state.stored.map((row) => [memberAssignmentKey(row.record.id), row]));
  return {
    additions: state.roles
      .filter((role) => !role.configurationKey)
      .map((role) => ({
        roleId: role.option.roleNode!.roleId!,
        roleRevisionRef: role.option.roleRevisionRef!,
        scopeBindings: Object.fromEntries(
          Object.entries(role.bindings).map(([key, binding]) => [
            key,
            { ...binding, ids: [...binding.ids] },
          ]),
        ),
        validFrom: state.validFrom,
        validUntil: state.validUntil,
      })),
    updates: state.roles.flatMap((role) => {
      const original = existing.get(role.configurationKey || "");
      return original &&
        !state.removed.includes(original.record.id) &&
        orderedBindings(role.bindings) !== orderedBindings(original.record.assignment.scopeBindings)
        ? [
            {
              assignmentId: original.record.id,
              expectedVersion: original.version,
              scopeBindings: Object.fromEntries(
                Object.entries(role.bindings).map(([key, binding]) => [
                  key,
                  { ...binding, ids: [...binding.ids] },
                ]),
              ),
            },
          ]
        : [];
    }),
    removals: state.stored
      .filter((row) => state.removed.includes(row.record.id))
      .map((row) => ({ assignmentId: row.record.id, expectedVersion: row.version })),
  };
}
export const hasMemberRoleChanges = (changes?: MemberRoleChanges): boolean =>
  !!changes && !!(changes.additions.length || changes.updates.length || changes.removals.length);

/** JSON 草稿仅含契约值，不与弹窗共享响应式引用。 */
export const cloneMemberRoleState = (state: MemberRoleEditorState): MemberRoleEditorState =>
  JSON.parse(JSON.stringify(state)) as MemberRoleEditorState;
