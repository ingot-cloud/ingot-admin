import { describe, expect, it } from "vitest";
import {
  AssignmentSource,
  GrantStatus,
  RoleKind,
  ScopeBindingKind,
  SubjectType,
  type ResourceDetail,
  type AssignmentRecord,
  type AuthorizationOption,
} from "@ingot/admin-common";
import {
  cloneMemberRoleState,
  emptyMemberRoleState,
  hasMemberRoleChanges,
  memberRoleChanges,
  memberAssignmentKey,
} from "./memberRoleEditor";
const option: AuthorizationOption = {
  id: "31",
  name: "测试 · v1",
  roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
  roleNode: {
    id: "31",
    name: "v1",
    roleId: "24",
    roleName: "测试",
    roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
  },
};
const row = (id: string, ids: string[]): ResourceDetail<AssignmentRecord> => ({
  record: {
    id,
    roleName: "测试",
    revisionNumber: "1",
    assignment: {
      subject: { type: SubjectType.MEMBER, id: "1001" },
      roleRevisionRef: option.roleRevisionRef!,
      scopeBindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids } },
      validFrom: "2026-01-01T00:00:00Z",
      validUntil: "2030-01-01T00:00:00Z",
    },
    status: GrantStatus.ACTIVE,
    source: AssignmentSource.MANUAL,
  },
  version: "2",
  capabilities: {},
  fieldAccess: {},
});
describe("成员角色差量草稿", () => {
  it("同版本多条分配独立保存，只调整改变的范围且不改角色或有效期", () => {
    const state = emptyMemberRoleState();
    state.stored = [row("81", ["1"]), row("82", ["2"])];
    state.roles = state.stored.map((item) => ({
      option,
      configurationKey: memberAssignmentKey(item.record.id),
      bindings: item.record.assignment.scopeBindings,
      selectedObjects: {},
    }));
    const copy = cloneMemberRoleState(state);
    copy.roles[0].bindings.objects.ids = ["3"];
    expect(memberRoleChanges(copy)).toEqual({
      additions: [],
      updates: [
        {
          assignmentId: "81",
          expectedVersion: "2",
          scopeBindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["3"] } },
        },
      ],
      removals: [],
    });
    expect(state.roles[0].bindings.objects.ids).toEqual(["1"]);
  });
  it("移除只针对明确加载的 ID，不用所选角色替换未加载记录", () => {
    const state = emptyMemberRoleState();
    state.stored = [row("81", ["1"])];
    state.removed = ["81", "unloaded"];
    expect(memberRoleChanges(state).removals).toEqual([
      { assignmentId: "81", expectedVersion: "2" },
    ]);
  });
  it("选择多个新角色保留固定版本、独立参数和可选期限", () => {
    const state = emptyMemberRoleState();
    state.validUntil = "2030-01-01T00:00:00Z";
    state.roles = [
      { option, bindings: {}, selectedObjects: {} },
      {
        option: {
          ...option,
          id: "41",
          roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "41" },
          roleNode: { ...option.roleNode!, roleId: "25" },
        },
        bindings: {},
        selectedObjects: {},
      },
    ];
    const changes = memberRoleChanges(state);
    expect(changes.additions.map((item) => item.roleId)).toEqual(["24", "25"]);
    expect(changes.additions[0].validUntil).toBe(state.validUntil);
    expect(changes.additions[0].roleRevisionRef.id).toBe("31");
  });
  it("未改变或仅对象顺序改变不产生范围更新", () => {
    const state = emptyMemberRoleState();
    state.stored = [row("81", ["1", "2"])];
    state.roles = [
      {
        option,
        configurationKey: memberAssignmentKey("81"),
        bindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["2", "1"] } },
        selectedObjects: {},
      },
    ];
    expect(hasMemberRoleChanges(memberRoleChanges(state))).toBe(false);
  });
});
