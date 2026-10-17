import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");

describe("org iam departments page", () => {
  it("部门是独立子页面，不挂成员表或 Tab", () => {
    expect(pageSource).toContain("DeptTab");
    expect(pageSource).not.toContain("MemberTab");
    expect(pageSource).not.toContain("in-biz-tabs");
    expect(pageSource).toContain("../members/components/DeptTab.vue");
  });
});
