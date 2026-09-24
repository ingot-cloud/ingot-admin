import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "GrantPicker.vue"), "utf8");

describe("platform iam GrantPicker", () => {
  it("已选回显走 lookup，展开资源走资源操作目录", () => {
    expect(source).toContain("PlatformActionLookupAPI");
    expect(source).toContain("PlatformResourceActionsAPI");
    expect(source).toContain("privateEnsureActions");
    expect(source).toContain("privateLoadNode");
    expect(source).not.toContain("collectIamPageRecords");
    expect(source).not.toContain("selected.map((resource) => privateEnsureActions(resource))");
  });
});
