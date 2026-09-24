import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "MenuEditDrawer.vue"),
  "utf8",
);

describe("platform iam application MenuEditDrawer", () => {
  it("创建菜单录入框有占位，关联操作走专用接口", () => {
    expect(source).toContain('placeholder="如组织与成员"');
    expect(source).toContain('placeholder="如 /iam/members，目录可空"');
    expect(source).toContain('placeholder="请选择视图注册键"');
    expect(source).toContain("viewPathOptionGroups");
    expect(source).toContain("action-picker-dialog");
    expect(source).toContain("配置操作");
    expect(source).toContain("action-hierarchy");
    expect(source).toContain("resolveCatalog");
    expect(source).toContain("loadApplicationCatalog");
    expect(source).toContain("loadMenuAssociatedActions");
    expect(source).toContain('layout="pinned"');
    expect(source).toContain("hydrateActions");
    expect(source).not.toContain("resourceId: resource.record.id");
    expect(source).toContain("MenuAccessMode.OPEN");
    expect(source).toContain("in-copy-tag");
    expect(source).not.toContain("size: 200");
    expect(source).not.toContain("collectIamPageRecords");
  });

  it("已有菜单先看详情再进入编辑", () => {
    expect(source).toContain("菜单详情");
    expect(source).toContain("session.enterEdit");
    expect(source).toContain("session.exitEdit");
    expect(source).toContain("@in-click=\"session.enterEdit\"");
  });
});
