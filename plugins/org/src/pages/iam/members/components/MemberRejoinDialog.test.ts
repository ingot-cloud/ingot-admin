import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(dir, "MemberRejoinDialog.vue"), "utf8");
const tabSource = readFileSync(resolve(dir, "MemberTab.vue"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../../api/iam/directory.ts"), "utf8");
const tableSource = readFileSync(resolve(dir, "../memberTable.ts"), "utf8");

describe("tenant member rejoin dialog", () => {
  it("预填资料并提交重新加入接口", () => {
    expect(source).toContain('title="重新加入"');
    expect(source).toContain("原有角色、用户组和负责人关系会被清除");
    expect(source).toContain("pb-24px");
    expect(source).toContain("plainMemberPhone");
    expect(source).toContain("plainMemberEmail");
    expect(source).toContain("TenantMemberRejoinAPI");
    expect(source).toContain("MEMBER_REJOINED");
    expect(source).toContain("expectedVersion");
    expect(tabSource).toContain("MemberRejoinDialog");
    expect(tabSource).toContain("onRejoin");
    expect(tabSource).toContain("handleRejoin");
    expect(apiSource).toContain("TenantMemberRejoinAPI");
    expect(apiSource).toContain("/rejoin");
    expect(tableSource).toContain("MEMBER_REJOINED");
  });
});
