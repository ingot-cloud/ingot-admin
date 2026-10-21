import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "MemberBatchDepartmentDialog.vue"),
  "utf8",
);

describe("MemberBatchDepartmentDialog", () => {
  it("两层对话框：先选部门再确认后才提交任职", () => {
    expect(source).toContain('title="变更部门"');
    expect(source).toContain("确定后，已选成员的部门将全部替换为新部门");
    expect(source).toContain("privateAskConfirm");
    expect(source).toContain('title="确认变更部门？"');
    expect(source).toContain("TenantMemberDepartmentsAPI");
    expect(source).toContain("已选：");
    expect(source).not.toContain("通讯录可见性");
  });
});
