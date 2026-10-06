import { describe, expect, it } from "vitest";
import { RoleKind, ScopeBindingKind, ScopeKind, SubjectType } from "./constants";
import type { AuthorizationOption } from "./types";
import {
  assignmentBatch,
  assignmentScopeConfigurations,
  assignmentScopeIssues,
  assignmentValidityIssue,
  reconcileAssignmentRoles,
} from "./platformAssignment";

const option = (id: string, resourceId = "100"): AuthorizationOption => ({
  id,
  name: `角色${id} · v1`,
  roleRevisionRef: { id, kind: RoleKind.PLATFORM_CUSTOM },
  parameterDefinitions: [{ key: "objects", kind: ScopeBindingKind.OBJECTS }],
  grants: [{ actionId: id, scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects" }] }],
  actions: [
    {
      id,
      name: "查看",
      applicationId: "1",
      applicationName: "平台",
      resourceId,
      resourceName: "应用",
      code: "iam-platform:application:read",
      scopeCapabilities: [ScopeKind.ALL, ScopeKind.OBJECT_SET],
    },
  ],
});
describe("平台多角色分配草稿", () => {
  it("同一固定版本的既有分配按记录键隔离参数配置", () => {
    const first = option("10");
    const roles = ["81", "82"].map((id) => ({
      option: first,
      configurationKey: `assignment:${id}`,
      bindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: [id] } },
      selectedObjects: {},
    }));
    const configs = assignmentScopeConfigurations(roles);
    expect(configs.map((item) => item.roleKey)).toEqual(["assignment:81", "assignment:82"]);
    expect(new Set(configs.map((item) => item.key)).size).toBe(2);
    expect(configs.every((item) => item.configured)).toBe(true);
  });
  it("配置按版本与参数统计，共用操作去重，同名参数互相隔离", () => {
    const first = option("10");
    first.grants!.push({
      actionId: "11",
      scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects" }],
    });
    first.actions!.push({ ...first.actions![0], id: "11", name: "编辑" });
    const roles = reconcileAssignmentRoles([], [first, option("20")]);
    roles[0].bindings.objects.ids = ["101"];
    const units = assignmentScopeConfigurations(roles);
    expect(units).toHaveLength(2);
    expect(units[0].actions).toHaveLength(2);
    expect(units.map((item) => item.configured)).toEqual([true, false]);
    expect(new Set(units.map((item) => item.key)).size).toBe(2);
    roles[0].option.actions = [];
    expect(assignmentScopeConfigurations(roles)[0]).toMatchObject({
      configured: false,
      supported: false,
    });
  });
  it("成员与组乘以多个角色，并隔离同名参数与请求快照", () => {
    const roles = reconcileAssignmentRoles([], [option("10"), option("20", "200")]);
    roles[0].bindings.objects.ids = ["101"];
    roles[1].bindings.objects.ids = ["201"];
    const batch = assignmentBatch(
      [
        { type: SubjectType.MEMBER, id: "1" },
        { type: SubjectType.GROUP, id: "2" },
      ],
      roles,
      "2026-10-05T00:00:00Z",
      "2026-10-06T00:00:00Z",
      "50",
    );
    expect(batch.items).toHaveLength(4);
    expect(batch.items.map((item) => item.scopeBindings.objects.ids)).toEqual([
      ["101"],
      ["201"],
      ["101"],
      ["201"],
    ]);
    roles[0].bindings.objects.ids.push("102");
    expect(batch.items[0].scopeBindings.objects.ids).toEqual(["101"]);
    expect(batch.items.every((item) => item.delegationGrantId === "50")).toBe(true);
  });
  it("保留未变化版本；替换或移除仅清理对应角色参数", () => {
    const roles = reconcileAssignmentRoles([], [option("10"), option("20")]);
    roles[0].bindings.objects.ids = ["101"];
    roles[1].bindings.objects.ids = ["201"];
    const next = reconcileAssignmentRoles(roles, [option("10"), option("21")]);
    expect(next[0].bindings.objects.ids).toEqual(["101"]);
    expect(next[1].bindings.objects.ids).toEqual([]);
    expect(reconcileAssignmentRoles(next, [option("10")])).toHaveLength(1);
  });
  it("指定对象必须配置，资料缺失和部门范围不能误作全部", () => {
    const roles = reconcileAssignmentRoles([], [option("10")]);
    expect(assignmentScopeIssues(roles)).toContain("角色10 · v1：请配置指定对象");
    roles[0].bindings.objects.ids = ["101"];
    expect(assignmentScopeIssues(roles)).toEqual([]);
    roles[0].option.actions = [];
    expect(assignmentScopeIssues(roles).join()).toContain("操作资料或范围不可用");
    roles[0].option.grants = [
      { actionId: "10", scopes: [{ kind: ScopeKind.MANAGED_DEPARTMENTS }] },
    ];
    expect(assignmentScopeIssues(roles).join()).toContain("平台角色不支持部门范围");
  });
  it("全部范围无参数仍具有完整可展示操作", () => {
    const all = {
      ...option("10"),
      parameterDefinitions: [],
      grants: [{ actionId: "10", scopes: [{ kind: ScopeKind.ALL }] }],
    };
    expect(assignmentScopeIssues(reconcileAssignmentRoles([], [all]))).toEqual([]);
  });
  it("有效期按真实 Instant 差值检查有限与不限时长的委派", () => {
    const basis = {
      administratorMemberId: "1",
      allowedRoleRevisionRefs: [],
      recipientSelection: { members: [], groups: [] },
      actionScopeCeilings: [],
      maxAssignmentDuration: "PT24H",
      assignmentDurationMode: "LIMITED" as const,
    };
    const now = Date.parse("2026-10-05T00:00:00Z");
    expect(assignmentValidityIssue(undefined, "2026-10-06T00:00:00Z", basis, now)).toBeUndefined();
    expect(assignmentValidityIssue(undefined, "2026-10-06T00:00:01Z", basis, now)).toContain(
      "单次最长时间",
    );
    expect(assignmentValidityIssue(undefined, undefined, basis, now)).toContain("请设置失效时间");
    expect(
      assignmentValidityIssue(
        undefined,
        undefined,
        { ...basis, assignmentDurationMode: "UNLIMITED" },
        now,
      ),
    ).toBeUndefined();
    expect(
      assignmentValidityIssue("2026-10-05T08:00:00+08:00", "2026-10-06T08:00:00+08:00", basis, now),
    ).toBeUndefined();
    expect(
      assignmentValidityIssue(
        undefined,
        undefined,
        { ...basis, assignmentDurationMode: "UNLIMITED", validUntil: "2026-10-06T00:00:00Z" },
        now,
      ),
    ).toContain("超出来源委派");
  });
});
