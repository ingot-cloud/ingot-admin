import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const workspaceSource = readFileSync(resolve(dir, "GroupWorkspace.vue"), "utf8");
const wizardSource = readFileSync(resolve(dir, "GroupWizard.vue"), "utf8");
const opsSource = readFileSync(resolve(dir, "../useOps.ts"), "utf8");

describe("org group workspace", () => {
  it("右侧有效成员走独立接口，已选栏仍用直接成员", () => {
    expect(opsSource).toContain("TenantGroupEffectiveMemberPageQueryOptions");
    expect(workspaceSource).toContain("TenantGroupBoundMembersLoad");
    expect(workspaceSource).not.toContain("ids: ids.join");
  });

  it("创建和编辑走分步向导，详情仍是抽屉", () => {
    expect(workspaceSource).toContain("group-wizard");
    expect(workspaceSource).toContain("group-detail-drawer");
    expect(workspaceSource).not.toContain("biz-iam-group-edit-drawer");
    expect(wizardSource).toContain("group-department-field");
    expect(wizardSource).toContain("allow-departments");
    expect(wizardSource).toContain("organization");
    expect(wizardSource).toContain("TenantGroupPreviewAPI");
  });

  it("仅直接添加可移出，部门来源保留在 PUT", () => {
    expect(workspaceSource).toContain("canRemoveDirectMembership");
    expect(opsSource).toContain("TenantGroupDetailAPI");
    expect(opsSource).toContain("departments: current.record.selection.departments");
    expect(opsSource).toContain("applyMemberChanges");
  });
});
