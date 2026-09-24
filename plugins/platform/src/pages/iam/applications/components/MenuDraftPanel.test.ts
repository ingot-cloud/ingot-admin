import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "MenuDraftPanel.vue"), "utf8");

describe("platform iam application MenuDraftPanel", () => {
  it("向导菜单步对齐详情树表和抽屉", () => {
    expect(source).toContain("menuHeaders");
    expect(source).toContain('tree-column="name"');
    expect(source).toContain("menu-edit-drawer");
    expect(source).toContain("创建菜单");
    expect(source).toContain("搜索菜单名");
    expect(source).toContain("upsertDraftMenu");
  });
});
