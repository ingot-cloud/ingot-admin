import { describe, expect, it, vi } from "vitest";
import { ScopeBindingKind, ScopeKind } from "@ingot/admin-common";
import {
  toDefinition,
  grantsFingerprint,
  collectParameters,
  defaultScope,
  formatScopeLine,
  parameterKeyFor,
  type SelectedGrant,
} from "./wizard";

vi.mock("@ingot/admin-common", () => ({
  ScopeBindingKind: { DEPARTMENTS: "DEPARTMENTS", OBJECTS: "OBJECTS" },
  ScopeKind: {
    ALL: "ALL",
    SELF: "SELF",
    MEMBER_DEPARTMENTS: "MEMBER_DEPARTMENTS",
    MANAGED_DEPARTMENTS: "MANAGED_DEPARTMENTS",
    OBJECT_SET: "OBJECT_SET",
  },
  FieldVisibility: { HIDDEN: "HIDDEN", MASKED: "MASKED", FULL: "FULL" },
  RoleKind: { SHARED: "SHARED", PLATFORM_CUSTOM: "PLATFORM_CUSTOM", SYSTEM: "SYSTEM" },
  formatScopeKinds: (kinds: string[]) => kinds.join("、"),
}));

const grant = (resourceId: string, kind: ScopeKind): SelectedGrant => ({
  applicationId: "100",
  applicationName: "租户应用",
  resourceId,
  resourceName: "成员",
  actionId: `action-${resourceId}`,
  actionName: "读取",
  actionCode: "iam-tenant:member:read",
  scopeCapabilities: [kind],
  scopes: [defaultScope([kind], resourceId)],
});

describe("角色范围内部参数", () => {
  it("为不同资源生成不同对象参数，分配界面只展示业务含义", () => {
    const first = grant("201", ScopeKind.OBJECT_SET);
    const second = grant("202", ScopeKind.OBJECT_SET);
    expect(first.scopes[0].parameterKey).toBe(parameterKeyFor("201", ScopeKind.OBJECT_SET));
    expect(collectParameters([first, second])).toEqual([
      { key: "objects_201", kind: ScopeBindingKind.OBJECTS },
      { key: "objects_202", kind: ScopeBindingKind.OBJECTS },
    ]);
    expect(formatScopeLine(first.scopes[0])).toContain("分配时选择指定对象");
    expect(formatScopeLine(first.scopes[0])).not.toContain("objects_201");
  });

  it("管理部门由分配时选择，沿用固定类型契约", () => {
    const item = grant("203", ScopeKind.MANAGED_DEPARTMENTS);
    expect(collectParameters([item])).toEqual([
      { key: "departments_203", kind: ScopeBindingKind.DEPARTMENTS },
    ]);
    expect(formatScopeLine(item.scopes[0])).toContain("分配时选择管理部门");
  });
});

describe("平台角色字段固定快照", () => {
  it("同资源只生成一份字段配置，选择变化不会残留其他资源", () => {
    const first = {
      ...grant("201", ScopeKind.ALL),
      fieldCapabilities: [
        {
          key: "phone",
          label: "手机号",
          visibilities: ["FULL", "MASKED"],
          editable: true,
          filterable: false,
          sortable: false,
        },
      ],
      fieldDefaults: { phone: { visibility: "MASKED", editable: false } },
    } as SelectedGrant;
    const second = { ...first, actionId: "update" };
    expect(toDefinition([first, second]).resourceFieldPermissions).toEqual({
      "201": { phone: { visibility: "MASKED", editable: false } },
    });
    expect(toDefinition([grant("202", ScopeKind.ALL)]).resourceFieldPermissions).toBeUndefined();
  });
  it("字段变化使语义指纹变化，已有范围不改变", () => {
    const first = grant("201", ScopeKind.OBJECT_SET);
    const changed = {
      ...first,
      fieldPermissions: { phone: { visibility: "FULL", editable: false } },
    } as SelectedGrant;
    expect(grantsFingerprint([first])).not.toEqual(grantsFingerprint([changed]));
    expect(toDefinition([changed]).grants).toEqual(toDefinition([first]).grants);
  });
});
