import { describe, expect, it } from "vitest";
import { cloneRevisionDefinition, roleVersionLabel, assignmentVersionLabel } from "./roleVersions";
import {
  RoleKind,
  ScopeKind,
  ScopeBindingKind,
  FieldVisibility,
  RoleDeltaOperation,
} from "./constants";
import type { RoleRevision } from "./types";
describe("角色固定版本编辑", () => {
  it("保留系统序号，旧数据与空名称回退且名称不充当ID", () => {
    expect(roleVersionLabel({ revision: "3" })).toBe("v3");
    expect(roleVersionLabel({ revision: "3", versionName: "  " })).toBe("v3");
    expect(roleVersionLabel({ revision: "3", versionName: "v3" })).toBe("v3");
    expect(assignmentVersionLabel({ revisionNumber: 3, versionName: "客服日常权限" })).toBe(
      "v3 · 客服日常权限",
    );
  });
  it("完整隔离历史操作、参数、定制差异、元数据和字段权限", () => {
    const source: RoleRevision = {
      id: "2",
      roleId: "1",
      revision: "2",
      kind: RoleKind.TENANT_CUSTOM,
      baseRevisionId: "30",
      grants: [
        { actionId: "11", scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "targets" }] },
      ],
      deltas: [{ actionId: "12", operation: RoleDeltaOperation.REMOVE, scopes: [] }],
      parameterDefinitions: [{ key: "targets", kind: ScopeBindingKind.OBJECTS }],
      metadataOverrides: { name: "定制权限" },
      resourceFieldPermissions: {
        "10": {
          visibility: { phone: FieldVisibility.MASKED },
          operations: { phone: { editable: true, filterable: false } },
        },
      },
    };
    const clone = cloneRevisionDefinition(source);
    expect(clone).toEqual({
      grants: source.grants,
      deltas: source.deltas,
      parameterDefinitions: source.parameterDefinitions,
      metadataOverrides: source.metadataOverrides,
      resourceFieldPermissions: source.resourceFieldPermissions,
    });
    clone.grants![0].scopes[0].parameterKey = "changed";
    clone.resourceFieldPermissions!["10"].operations.phone.editable = false;
    clone.parameterDefinitions![0].key = "changed";
    expect(source.grants[0].scopes[0].parameterKey).toBe("targets");
    expect(source.resourceFieldPermissions!["10"].operations.phone.editable).toBe(true);
    expect(source.parameterDefinitions[0].key).toBe("targets");
  });
});
