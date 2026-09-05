import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("platform dashboard IndexPage", () => {
  it("使用 Overview 的 page 模式页面框架", () => {
    expect(source).toContain("in-page-frame");
    expect(source).toContain('mode="page"');
    expect(source).toContain("in-page-header");
    expect(source).not.toContain('title="工作台"');
    expect(source).not.toContain("@refresh");
  });
});
