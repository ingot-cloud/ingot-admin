import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("org contacts structure IndexPage", () => {
  it("使用 contained workspace 与页面头说明", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="浏览当前组织的部门架构。"');
    expect(source).toContain("in-split-layout");
    expect(source).not.toContain("ContactsTabs");
  });
});
