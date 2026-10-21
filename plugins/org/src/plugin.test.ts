import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "plugin.ts"), "utf8");

describe("org plugin", () => {
  it("隐藏注册成员表格导入导出页并挂到主布局", () => {
    expect(source).toContain('path: "/org/iam/members/workbook"');
    expect(source).toContain('viewPath: "org.iam.members.workbook"');
    expect(source).toContain("PageLayoutViewPath.MAIN");
    expect(source).toContain("hidden: true");
  });
});
