import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);
const roleDrawerSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/RoleDrawer.vue"),
  "utf8",
);

describe("platform config role IndexPage", () => {
  it("使用 contained 列表契约并接入表格工具", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("applyColumnSelection");
    expect(source).toContain("in-table-actions");
    expect(source).toContain("ROLE_TABLE_ID");
    expect(source).toContain('density="compact"');
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("#toolbar");
    expect(source.indexOf("</in-page-frame>")).toBeLessThan(source.indexOf("RoleDrawer"));
    expect(source).toContain("DataRuleDrawer");
    expect(roleDrawerSource).toContain("filterDept");
    expect(roleDrawerSource).not.toContain("scopeType");
    expect(roleDrawerSource).not.toContain("scopes");
  });
});
