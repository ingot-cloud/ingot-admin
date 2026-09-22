import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "MenuEditDrawer.vue"),
  "utf8",
);

describe("platform iam application MenuEditDrawer", () => {
  it("创建菜单录入框有占位，关联操作远程分页", () => {
    expect(source).toContain('placeholder="如组织与成员"');
    expect(source).toContain('placeholder="如 /iam/members，目录可空"');
    expect(source).toContain('placeholder="搜索操作名"');
    expect(source).toContain("biz-iam-chip-page-select");
    expect(source).toContain("hydrateActionLabels");
    expect(source).not.toContain("size: 200");
  });

  it("已有菜单先看详情再进入编辑", () => {
    expect(source).toContain("菜单详情");
    expect(source).toContain("session.enterEdit");
    expect(source).toContain("session.exitEdit");
    expect(source).toContain("@in-click=\"session.enterEdit\"");
  });
});
