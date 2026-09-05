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
    expect(source).toContain("in-page-header");
    expect(source).toContain("in-biz-tabs-header");
    expect(source).toContain("visitedTabs");
    expect(source).toContain('v-if="visitedTabs[AccountProtectionTabEnum.LOCKOUT]"');
    expect(source).not.toContain("@refresh");
  });

  it("B/C 两栏保持独立保存入口", () => {
    expect(panelSource).toContain("SessionUserTypeEnum.ADMIN");
    expect(panelSource).toContain("SessionUserTypeEnum.APP");
    expect(panelSource).toContain(':save-policy="savePolicy"');
    expect(columnSource).toContain('variant="bordered"');
    expect(columnSource).toContain("privateOnSaveClick");
    expect(columnSource).toContain("allowPermanent");
  });
});
