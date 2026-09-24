import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("platform iam applications IndexPage", () => {
  it("主搜索直出，状态和组织默认进入筛选浮层", () => {
    expect(source).toContain('placeholder="搜索应用名"');
    expect(source).toContain("in-filter-panel");
    expect(source).toContain(":active-count=\"extraFilterCount\"");
    expect(source).toContain('label="状态"');
    expect(source).toContain('label="组织默认"');
    expect(source).toContain("privateOnResetExtra");
    expect(source).toContain("in-table-column-setting");
    expect(source.indexOf("搜索应用名")).toBeLessThan(source.indexOf("in-filter-panel"));
    expect(source.indexOf("in-filter-panel")).toBeLessThan(source.indexOf("in-table-column-setting"));
    expect(source.indexOf('label="状态"')).toBeGreaterThan(source.indexOf("in-filter-panel"));
    expect(source.indexOf('label="组织默认"')).toBeGreaterThan(source.indexOf("in-filter-panel"));
  });

  it("应用编码用可复制标签展示", () => {
    expect(source).toContain('<in-copy-tag :text="item.record.code" />');
    expect(source).toContain("catalog-icon-preview");
    expect(source).toContain("item.record.icon");
  });

  it("删除确认说明资源和外部引用会挡住删除", () => {
    expect(source).toContain("下有资源、菜单或仍被组织开通、套餐引用时无法删除");
  });
});
