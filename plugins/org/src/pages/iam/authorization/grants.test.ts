import { ScopeBindingKind, ScopeKind, FieldVisibility, type CurrentRoleCatalogAction } from "@ingot/admin-common";
import { describe, expect, it } from "vitest";
import {
  createRoleCode,
  formatScopeLine,
  mergeCatalog,
  toCreateInput,
  type RoleProfile,
} from "./grants";

const action = (overrides: Partial<CurrentRoleCatalogAction>): CurrentRoleCatalogAction => ({
  actionId: "1",
  actionCode: "org.member.read",
  actionName: "查看成员",
  applicationId: "9",
  applicationName: "组织",
  resourceId: "3",
  resourceName: "成员",
  enabled: true,
  scopeCapabilities: [ScopeKind.ALL],
  parameterDefinitions: [],
  ...overrides,
});

describe("tenant role grants", () => {
  it("入库编码自动生成，范围说明只用中文且不带参数键", () => {
    const code = createRoleCode();
    expect(code.startsWith("org-role-")).toBe(true);
    expect(code).toHaveLength("org-role-".length + 24);
    const line = formatScopeLine({
      kind: ScopeKind.MANAGED_DEPARTMENTS,
      parameterKey: "resource-3-departments",
      includeDescendants: true,
    });
    expect(line).toContain("管理部门");
    expect(line).toContain("含下级");
    expect(line).not.toContain("resource-");
  });

  it("创建请求带隐藏编码，界面字段只保留名称说明和分组", () => {
    const profile: RoleProfile = { name: "  人事  ", description: "  ", groupName: " 组织 " };
    const input = toCreateInput(profile, "org-role-abc", [
      {
        actionId: "1",
        actionName: "查看成员",
        resourceId: "3",
        resourceName: "成员",
        applicationId: "9",
        applicationName: "组织",
        scopes: [
          {
            kind: ScopeKind.MANAGED_DEPARTMENTS,
            parameterKey: "resource-3-departments",
          },
        ],
        scopeCapabilities: [ScopeKind.MANAGED_DEPARTMENTS],
      },
    ]);
    expect(input.code).toBe("org-role-abc");
    expect(input.name).toBe("人事");
    expect(input.description).toBeUndefined();
    expect(input.groupName).toBe("组织");
    expect(input.definition.parameterDefinitions).toEqual([
      { key: "resource-3-departments", kind: ScopeBindingKind.DEPARTMENTS, resourceId: "3" },
    ]);
    expect(input.definition.resourceFieldPermissions).toBeUndefined();
  });

  it("字段快照按资源中文能力写入当前定义", () => {
    const input = toCreateInput({ name: "人事", description: "", groupName: "" }, "org-role-abc", [
      {
        actionId: "1",
        actionName: "查看成员",
        resourceId: "3",
        resourceName: "成员",
        applicationId: "9",
        applicationName: "组织",
        scopes: [{ kind: ScopeKind.ALL }],
        scopeCapabilities: [ScopeKind.ALL],
        fieldCapabilities: [
          {
            key: "phone",
            label: "手机号",
            visibilities: [FieldVisibility.HIDDEN, FieldVisibility.MASKED, FieldVisibility.FULL],
            editable: false,
            filterable: false,
          },
        ],
        fieldDefaults: { phone: { visibility: FieldVisibility.MASKED, editable: false } },
      },
    ]);
    expect(input.definition.resourceFieldPermissions?.["3"]?.visibility.phone).toBe(FieldVisibility.MASKED);
  });

  it("扁平操作目录按资源归并", () => {
    const merged = mergeCatalog(
      [],
      [
        action({ actionId: "1", actionName: "查看成员" }),
        action({ actionId: "2", actionName: "编辑成员", actionCode: "org.member.update" }),
      ],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.actions.map((item) => item.name)).toEqual(["查看成员", "编辑成员"]);
  });
});
