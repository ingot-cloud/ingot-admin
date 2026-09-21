import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const opsSource = readFileSync(resolve(dir, "useOps.ts"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../api/iam/directory.ts"), "utf8");

describe("org iam directory", () => {
  it("通讯录部门列表固定带 DIRECTORY purpose，且没有创建入口", () => {
    expect(apiSource).toContain("SelectionPurpose.DIRECTORY");
    expect(opsSource).toContain("DirectoryDepartmentPageAPI");
    expect(pageSource).not.toContain("handleCreate");
    expect(pageSource).toContain("DirectoryMemberDrawer");
  });
});
