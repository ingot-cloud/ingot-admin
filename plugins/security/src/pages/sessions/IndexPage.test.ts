import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const panel = readFileSync(resolve(dir, "components/SessionListPanel.vue"), "utf8");

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

describe("security sessions SessionListPanel", () => {
  it("主搜索直出，其余条件进筛选浮层", () => {
    expect(panel).toContain("in-filter-panel");
    expect(panel).toContain('placeholder="搜索用户 ID"');
    expect(panel).toContain('placeholder="搜索登录 IP"');
    expect(panel).toContain("extraFilterCount");
    expect(panel).toContain("resetExtraFilters");
    expect(panel).not.toContain("in-filter-item");
    expect(panel).not.toContain("in-with-label");
    expect(panel).not.toContain(">搜索<");
    expect(panel).not.toContain("更多");
  });
});
