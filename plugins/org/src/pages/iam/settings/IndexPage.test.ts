import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const basic = readFileSync(resolve(dir, "components/OrgBasicDialog.vue"), "utf8");
const password = readFileSync(resolve(dir, "components/OrgTransferPasswordDialog.vue"), "utf8");
const directory = readFileSync(resolve(dir, "../../../api/iam/directory.ts"), "utf8");

describe("组织设置页", () => {
  it("基础信息可改 Logo 和名称，更多信息只读，底部是转交而不是解散", () => {
    expect(page).toContain("基础信息");
    expect(page).toContain("更多信息");
    expect(page).toContain("转交所有者");
    expect(page).toContain('type="danger"');
    const template = page.slice(0, page.indexOf("<script"));
    expect(template.match(/org-settings__panel/g)?.length).toBe(3);
    expect(page).toContain("border: 1px solid var(--in-border-color)");
    expect(basic).toContain("in-common-upload-avatar");
    expect(basic).toContain("请输入组织名称");
    expect(page).not.toContain("解散");
    expect(page).not.toContain("planId");
  });

  it("选人确认后才打开密码框，页面本身不提交转交", () => {
    const pick = page.indexOf("privateOnMember");
    const ownerGuard = page.indexOf("不能转交给当前所有者");
    const openPassword = page.indexOf("passwordRef.value?.show");
    expect(pick).toBeGreaterThan(-1);
    expect(ownerGuard).toBeGreaterThan(pick);
    expect(openPassword).toBeGreaterThan(ownerGuard);
    expect(page).not.toContain("TenantOwnerTransferAPI");
    expect(page).toContain(':multiple="false"');
  });

  it("密码与人选在同一次请求里提交，取消或空密码不调用接口", () => {
    expect(password).toContain("SensitiveConfirmationKind.LOGIN_PASSWORD");
    expect(password).toContain("confirmation:");
    expect(password).toContain("if (!password || saving.value)");
    expect(password).toContain("请输入登录密码");
    expect(password).toContain("IamReasonCode.STEP_UP_FAILED");
    expect(directory).toContain('fields: ["secret"]');
  });
});
