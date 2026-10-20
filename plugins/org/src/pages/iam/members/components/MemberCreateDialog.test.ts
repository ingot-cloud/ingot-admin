import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(dir, "MemberCreateDialog.vue"), "utf8");
const tabSource = readFileSync(resolve(dir, "MemberTab.vue"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../../api/iam/directory.ts"), "utf8");

describe("tenant member create dialog", () => {
  it("使用添加成员对话框而不是账号 ID 抽屉", () => {
    expect(source).toContain('title="添加成员"');
    expect(source).toContain("基础信息");
    expect(source).toContain('label="姓名"');
    expect(source).toContain('label="部门"');
    expect(source).toContain('label="手机号码"');
    expect(source).toContain('label="工作邮箱"');
    expect(source).toContain("成员可用手机号登录");
    expect(source).toContain("+86");
    expect(source).toContain("完成");
    expect(source).toContain("member-department-field");
    expect(source).toContain("BizIamAccountSecretDialog");
    expect(source).toContain("MEMBER_JOINED_EXISTING");
    expect(source).toContain("MEMBER_REJOINED");
    expect(source).toContain("response.data.rejoined");
    expect(source).not.toContain("添加组织成员");
    expect(source).not.toContain("账号 ID");
    expect(source).not.toContain("登录名");
    expect(source).not.toContain("TenantAccountLookupAPI");
    expect(tabSource).toContain("MemberCreateDialog");
    expect(tabSource).not.toContain("MemberCreateDrawer");
    expect(apiSource).toContain("TenantMemberCreateInput");
    expect(apiSource).toContain("TenantMemberCreated");
    expect(apiSource).toContain('mode: "data_only"');
  });
});
