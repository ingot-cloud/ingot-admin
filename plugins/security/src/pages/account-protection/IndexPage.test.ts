import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);
const panelSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/LockoutPolicyPanel.vue"),
  "utf8",
);
const columnSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/LockoutPolicyColumn.vue"),
  "utf8",
);

describe("account-protection IndexPage", () => {
  it("使用 Settings 的 page 模式和局部 Tab 懒挂载", () => {
    expect(source).toContain('mode="page"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain("in-biz-tabs-header");
    expect(source).toMatch(/<in-page-header[\s\S]*?\/>\s*<\/template>\s*<template #tabs>/);
    expect(source).toContain("visitedTabs");
    expect(source).toMatch(
      /v-if="\s*allowed\(AccountProtectionTabEnum.ADMIN_LOCKOUT\)\s*&&\s*visitedTabs\[AccountProtectionTabEnum.ADMIN_LOCKOUT\]\s*"/,
    );
    expect(source).not.toContain("@refresh");
  });

  it("B/C 独立 Tab 使用相同正文容器与单端保存入口", () => {
    expect(panelSource).toContain("SessionUserTypeEnum.ADMIN");
    expect(source).toContain("AccountProtectionTabEnum.APP_LOCKOUT");
    expect(source).toContain(':user-type="SessionUserTypeEnum.APP"');
    expect(panelSource).toContain("useLockoutPolicy(props.userType, props.tab)");
    expect(panelSource).toContain(':save-policy="savePolicy"');
    expect(source).toContain("in-form-content");
    expect(columnSource).toContain('<section class="lockout-column"');
    expect(columnSource).toContain("privateOnSaveClick");
    expect(columnSource).toContain("allowPermanent");
  });
});
