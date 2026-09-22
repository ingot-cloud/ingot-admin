import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "catalog.ts"), "utf8");

describe("platform iam catalog api", () => {
  it("目录取数使用默认分页和菜单树视图，不一次拉 200 条", () => {
    expect(source).toContain("IAM_DEFAULT_PAGE_SIZE");
    expect(source).toContain("CatalogListView.TREE");
    expect(source).toContain("resourceId");
    expect(source).toContain("ResourceListQuery");
    expect(source).not.toContain("size: 200");
  });
});
