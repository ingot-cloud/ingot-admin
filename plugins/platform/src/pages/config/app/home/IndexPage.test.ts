import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("platform config app home IndexPage", () => {
  it("使用 contained 列表契约并接入表格工具", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("in-picker");
    expect(source).toContain('label="应用类型"');
    expect(source).toContain('label="状态"');
    expect(source).toContain("appTypeFilterOptions");
    expect(source).toContain("appStatusFilterOptions");
    expect(source).toContain('placeholder="搜索应用名"');
    expect(source).toContain(":prefix-icon=\"Search\"");
    expect(source).not.toContain("in-filter-item");
    expect(source).not.toContain("in-with-label");
    expect(source.indexOf("in-picker")).toBeLessThan(source.indexOf("in-table-column-setting"));
    expect(source.indexOf("搜索应用名")).toBeLessThan(source.indexOf("in-table-column-setting"));
    expect(source).toContain("applyColumnSelection");
    expect(source).toContain("in-table-actions");
    expect(source).toContain("APP_HOME_TABLE_ID");
    expect(source).toContain('density="compact"');
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("#toolbar");
  });
});
