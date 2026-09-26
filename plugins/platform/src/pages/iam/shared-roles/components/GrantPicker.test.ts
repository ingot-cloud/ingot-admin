import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "GrantPicker.vue"), "utf8");

describe("platform iam GrantPicker", () => {
  it("用 grant-catalog 分页内嵌操作，回显不算全选半选以外的 /actions", () => {
    expect(source).toContain("PlatformGrantCatalogAPI");
    expect(source).toContain("cloneResources");
    expect(source).toContain("resourceReady");
    expect(source).toContain("resourceNodesOf");
    expect(source).toContain("beginTreeSync");
    expect(source).toContain("applyingChecks");
    expect(source).toContain("in-loading");
    expect(source).toContain(":loading=\"appLoading\"");
    expect(source).toContain(":loading=\"resourceLoading\"");
    expect(source).not.toContain("PlatformActionLookupAPI");
    expect(source).not.toContain("PlatformResourcePageAPI");
    expect(source).not.toContain("PlatformResourceActionsAPI");
    expect(source).not.toContain("privateEnsureActions");
    expect(source).not.toContain("lazy");
    expect(source).not.toContain("for (const id of byResource.keys())");
    expect(source).not.toContain("collectIamPageRecords");
  });

  it("已选以 grants 为准，右侧已选列可移除，资源显示全部或已选数", () => {
    expect(source).toContain("selectedGroups");
    expect(source).toContain("groupGrants");
    expect(source).toContain("privateRemoveGrant");
    expect(source).toContain("resourceCheckHint");
    expect(source).toContain("全部");
    expect(source).toContain("已选 ${selected}");
    expect(source).toContain("已选 {{ grants.length }} 个权限");
    expect(source).toContain("尚未选择权限");
    expect(source).toContain("in-close-button");
    expect(source).toContain("replaceLoadedGrants");
  });
});
