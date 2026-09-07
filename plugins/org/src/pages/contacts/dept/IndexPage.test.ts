import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("org contacts dept IndexPage", () => {
  it("使用 contained List，无左树", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="维护组织部门、主管和编制。"');
    expect(source).not.toContain('title="部门"');
    expect(source).not.toContain("#left");
    expect(source).not.toContain("left-collapsible");
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("applyColumnSelection");
    expect(source).toContain("in-table-actions");
    expect(source).toContain("ORG_DEPT_TABLE_ID");
    expect(source).toContain('density="compact"');
    expect(source).toContain('tree-column="name"');
    expect(source).toContain(":checkbox=");
    expect(source).toContain(":tree-expand=");
    expect(source).toContain("in-common-status-tag");
    expect(source).toContain('placeholder="搜索部门名"');
    expect(source).not.toContain("#name-header");
    expect(source).not.toContain("in-table-tree-cell");
    expect(source).toContain("@selection-change");
    expect(source).toContain("selected-count");
    expect(source).not.toContain("el-table__row--level-0");
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("ContactsTabs");
    expect(source).not.toContain("mingcute:department-line");
    expect(source).not.toContain("Confirm.warning");
    expect(source).toContain("CreateDrawer");
    expect(source).toContain("DetailDrawer");
    expect(source).not.toContain("EditDrawer");
    expect(source).toContain("handleDetail");
    expect(source).toContain("handleCreate");
    expect(source).toContain("handleBatchDelete");
  });
});
