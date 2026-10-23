import { describe, expect, it } from "vitest";
import { ScopeBindingKind, SubjectType } from "./constants";
import type { CurrentRoleGrantList, TenantDelegationMine } from "./tenantCurrentRoles";
import {
  applyTenantRoleDefinition,
  reconcileTenantAssignmentRoles,
  tenantAssignmentBatch,
  tenantAssignmentScopeIssues,
  tenantAssignmentScopeItems,
  tenantAssignmentValidityIssue,
} from "./tenantAssignment";

const definition = (...parameters: Array<[string, ScopeBindingKind]>): CurrentRoleGrantList => ({
  items: parameters.map(([key]) => ({
    actionId: `a-${key}`,
    actionCode: "iam-tenant:member:read",
    actionName: "查看成员",
    applicationId: "1",
    applicationName: "组织",
    resourceId: `r-${key}`,
    resourceName: key === "dept" ? "部门" : "成员",
    enabled: true,
    scopeCapabilities: [],
    parameterDefinitions: [],
  })),
  definition: {
    grants: [],
    parameterDefinitions: parameters.map(([key, kind]) => ({ key, kind, resourceId: `r-${key}` })),
  },
});

describe("租户多角色分配草稿", () => {
  it("重选角色保留已加载定义与参数，移除的角色丢弃", () => {
    const loaded = applyTenantRoleDefinition(
      { role: { id: "1", name: "角色1" }, bindings: {}, selectedObjects: {} },
      definition(["dept", ScopeBindingKind.DEPARTMENTS]),
    );
    loaded.bindings.dept.ids = ["9"];
    const next = reconcileTenantAssignmentRoles(
      [loaded],
      [
        { id: "2", name: "角色2" },
        { id: "1", name: "角色1" },
      ],
    );
    expect(next.map((draft) => draft.role.id)).toEqual(["2", "1"]);
    expect(next[1].bindings.dept.ids).toEqual(["9"]);
    expect(next[0].definition).toBeUndefined();
  });

  it("重新加载定义只保留同 key 同类型的参数", () => {
    const draft = {
      role: { id: "1", name: "角色1" },
      bindings: {
        dept: { kind: ScopeBindingKind.DEPARTMENTS, ids: ["9"] },
        gone: { kind: ScopeBindingKind.OBJECTS, ids: ["3"] },
      },
      selectedObjects: { gone: [{ id: "3", name: "对象3" }] },
    };
    const next = applyTenantRoleDefinition(
      draft,
      definition(["dept", ScopeBindingKind.OBJECTS], ["members", ScopeBindingKind.OBJECTS]),
    );
    expect(next.bindings).toEqual({
      dept: { kind: ScopeBindingKind.OBJECTS, ids: [] },
      members: { kind: ScopeBindingKind.OBJECTS, ids: [] },
    });
    expect(next.selectedObjects).toEqual({});
  });

  it("未加载或未填参数都算待配置，按角色与资源标注", () => {
    const loaded = applyTenantRoleDefinition(
      { role: { id: "1", name: "角色1" }, bindings: {}, selectedObjects: {} },
      definition(["dept", ScopeBindingKind.DEPARTMENTS]),
    );
    const pending = { role: { id: "2", name: "角色2" }, bindings: {}, selectedObjects: {} };
    expect(tenantAssignmentScopeItems([loaded])[0].label).toBe("角色1 / 部门 · 管理部门");
    expect(tenantAssignmentScopeIssues([loaded, pending])).toEqual([
      "角色2：角色资料未加载，请重新加载",
      "角色1 / 部门 · 管理部门：请选择管理部门",
    ]);
    loaded.bindings.dept.ids = ["9"];
    expect(tenantAssignmentScopeIssues([loaded])).toEqual([]);
  });

  it("按接收对象 × 角色展开，参数各自复制", () => {
    const first = applyTenantRoleDefinition(
      { role: { id: "1", name: "角色1" }, bindings: {}, selectedObjects: {} },
      definition(["dept", ScopeBindingKind.DEPARTMENTS]),
    );
    first.bindings.dept.ids = ["9"];
    const second = applyTenantRoleDefinition(
      { role: { id: "2", name: "角色2" }, bindings: {}, selectedObjects: {} },
      definition(),
    );
    const batch = tenantAssignmentBatch(
      [
        { type: SubjectType.MEMBER, id: "4" },
        { type: SubjectType.MEMBER, id: "5" },
        { type: SubjectType.GROUP, id: "6" },
      ],
      [first, second],
      undefined,
      "2026-10-30T00:00:00Z",
      "7",
    );
    expect(batch.items).toHaveLength(6);
    expect(batch.items[0]).toEqual({
      subject: { type: SubjectType.MEMBER, id: "4" },
      roleId: "1",
      scopeBindings: { dept: { kind: ScopeBindingKind.DEPARTMENTS, ids: ["9"] } },
      validFrom: undefined,
      validUntil: "2026-10-30T00:00:00Z",
      delegationGrantId: "7",
    });
    expect(batch.items[0].scopeBindings.dept.ids).not.toBe(first.bindings.dept.ids);
    expect(JSON.stringify(batch)).not.toMatch(/Revision|version/);
  });

  it("委派来源要求失效时间且不超过单次最长时长", () => {
    const now = Date.parse("2026-10-22T00:00:00Z");
    const source: TenantDelegationMine = {
      id: "7",
      allowedRoles: [],
      recipientSummary: "1 名成员",
      directAssignmentActions: [],
      maxAssignmentDuration: "P7D",
      scopeIssues: [],
    };
    expect(tenantAssignmentValidityIssue(undefined, undefined, undefined, now)).toBeUndefined();
    expect(tenantAssignmentValidityIssue(undefined, undefined, source, now)).toContain(
      "请设置失效时间",
    );
    expect(
      tenantAssignmentValidityIssue(undefined, "2026-10-29T00:00:00Z", source, now),
    ).toBeUndefined();
    expect(tenantAssignmentValidityIssue(undefined, "2026-10-29T00:00:01Z", source, now)).toContain(
      "单次最长时间",
    );
  });
});
