import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "DetailDrawer.vue"),
  "utf8",
);

describe("platform iam plan DetailDrawer", () => {
  it("详情回显应用内容，编辑后打开选择应用对话框", () => {
    expect(source).toContain('placeholder="请输入套餐名称"');
    expect(source).toContain('placeholder="请输入说明"');
    expect(source).toContain('placeholder="请选择状态"');
    expect(source).toContain("record.applications");
    expect(source).toContain("配置应用");
    expect(source).toContain("ApplicationPickerDialog");
    expect(source).not.toContain("远程分页添加应用");
  });
});
