import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);
const leftSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/LeftContent.vue"),
  "utf8",
);

describe("platform config dict IndexPage", () => {
  it("使用可折叠 Split List 与表格工具", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("left-collapsible");
    expect(source).toContain("DICT_SPLIT_KEY");
    expect(source).toContain("in-page-header");
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("applyColumnSelection");
    expect(source).toContain("in-table-actions");
    expect(source).toContain("DICT_TABLE_ID");
    expect(source).toContain('density="compact"');
    expect(source).toContain("in-table__count");
    expect(source).toContain("in-picker");
    expect(source).toContain('label="作用域"');
    expect(source).toContain('label="状态"');
    expect(source).toContain('placeholder="搜索名称"');
    expect(source).not.toContain("#summary");
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("#toolbar");
    expect(source).not.toContain("onNodeClick");
  });

  it("左树向页面发出 kebab-case 选择事件", () => {
    expect(leftSource).toContain('"node-click"');
    expect(leftSource).toContain('"node-edit-click"');
    expect(source).toContain("@node-click");
    expect(source).toContain("@node-edit-click");
    expect(leftSource).not.toContain(".rect");
    expect(leftSource).not.toContain("#192f48");
  });
});
