import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("security sessions IndexPage", () => {
  it("使用 Settings 的 page 模式和局部 Tab 懒挂载", () => {
    expect(source).toContain('mode="page"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="查询在线会话并配置并发策略。"');
    expect(source).toContain("in-biz-tabs-header");
    expect(source).toContain("visitedTabs");
    expect(source).not.toContain("@refresh");
  });
});
