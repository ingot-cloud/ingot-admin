import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "CreateDrawer.vue"),
  "utf8",
);

describe("platform iam plan CreateDrawer", () => {
  it("创建套餐录入框有基本占位", () => {
    expect(source).toContain('placeholder="请输入套餐名称"');
    expect(source).toContain('placeholder="请输入说明"');
    expect(source).toContain('placeholder="远程分页添加应用"');
  });
});
