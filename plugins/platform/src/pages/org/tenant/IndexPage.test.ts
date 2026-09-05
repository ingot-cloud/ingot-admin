import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("platform tenant IndexPage", () => {
  it("使用 contained 列表契约并接入表格工具", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).not.toContain('title="组织管理"');
    expect(source).not.toContain("<template #title>组织</template>");
    expect(source).toContain("in-column-setting");
    expect(source).toContain("in-table-actions");
    expect(source).toContain("TENANT_TABLE_ID");
    expect(source).toContain('density="compact"');
    expect(source).not.toContain("@refresh");
  });
});
