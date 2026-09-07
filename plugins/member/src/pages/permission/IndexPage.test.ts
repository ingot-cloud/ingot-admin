import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("member permission IndexPage", () => {
  it("使用 contained 列表契约并接入表格工具", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="维护会员权限树。"');
    expect(source).not.toContain("<template #top>");
    expect(source).toContain('placeholder="搜索权限名"');
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("applyColumnSelection");
    expect(source).toContain("in-table-actions");
    expect(source).toContain("MEMBER_PERMISSION_TABLE_ID");
    expect(source).toContain('density="compact"');
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("#toolbar");
    expect(source).not.toContain("Confirm.warning");
    expect(source.indexOf("</in-page-frame>")).toBeLessThan(source.indexOf("<EditDrawer"));
  });
});
