import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const opsSource = readFileSync(resolve(dir, "useOps.ts"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../api/iam/directory.ts"), "utf8");

describe("org iam members department tree", () => {
  it("不把单页上限当整棵树一次拉完", () => {
    expect(pageSource).not.toContain("size: 200");
    expect(opsSource).not.toContain("size: 200");
    expect(opsSource).toContain("collectIamPageRecords");
    expect(opsSource).toContain("buildDepartmentTree");
  });

  it("租户部门列表固定带管理部门 purpose", () => {
    expect(apiSource).toContain("SelectionPurpose.MANAGED_DEPARTMENT");
    expect(apiSource).toContain("toPurposeParams(page, condition, SelectionPurpose.MANAGED_DEPARTMENT)");
  });
});
