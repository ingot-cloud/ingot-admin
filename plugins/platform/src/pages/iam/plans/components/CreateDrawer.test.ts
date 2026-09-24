import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "CreateWizard.vue"),
  "utf8",
);

const wizard = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../wizard.ts"), "utf8");

describe("platform iam plan CreateWizard", () => {
  it("创建套餐分阶段录入，应用在对话框中选择", () => {
    expect(source).toContain('placeholder="请输入套餐名称"');
    expect(source).toContain('placeholder="请输入说明"');
    expect(source).toContain("PLAN_WIZARD_STEPS");
    expect(source).toContain("配置应用");
    expect(wizard).toContain("预览创建");
    expect(source).not.toContain("远程分页添加应用");
  });
});
