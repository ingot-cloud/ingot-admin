import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "DeptTab.vue"), "utf8");

describe("org iam members DeptTab", () => {
  it("使用树形表而不是左树按钮", () => {
    expect(source).toContain('tree-column="name"');
    expect(source).toContain('placeholder="搜索部门名"');
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("DeptCreateDrawer");
    expect(source).toContain("DeptDetailDrawer");
    expect(source).not.toContain("#left");
    expect(source).not.toContain("left-collapsible");
    expect(source).not.toContain("DepartmentEditDrawer");
    expect(source).toContain('tree-expand="canExpandDept"');
    expect(source).toContain("DEPT_TABLE_ROW_HEIGHT");
    expect(source).toContain("is-root");
    expect(source).toContain("in-table-tree-expand-spacer");
    expect(source).toContain(":checkbox=");
    expect(source).toContain("@selection-change");
    expect(source).toContain("selected-count");
    expect(source).toContain("handleBatchDelete");
    expect(source).toContain("#name-header");
    expect(source).toContain("formatSelectionColumnLabel");
  });
});
