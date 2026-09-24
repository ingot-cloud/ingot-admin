import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "CatalogDraftPanel.vue"),
  "utf8",
);

describe("platform iam application CatalogDraftPanel", () => {
  it("向导资源步对齐详情表格和抽屉", () => {
    expect(source).toContain("resourceHeaders");
    expect(source).toContain("创建资源");
    expect(source).toContain("resource-edit-drawer");
    expect(source).toContain("action-list-dialog");
    expect(source).toContain("privateOpenActions");
    expect(source).toContain("搜索资源名");
    expect(source).not.toContain("添加操作");
  });
});
