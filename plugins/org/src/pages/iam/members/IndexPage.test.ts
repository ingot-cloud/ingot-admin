import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const memberOpsSource = readFileSync(resolve(dir, "useMemberOps.ts"), "utf8");
const deptOpsSource = readFileSync(resolve(dir, "useDeptOps.ts"), "utf8");
const memberTabSource = readFileSync(resolve(dir, "components/MemberTab.vue"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../api/iam/directory.ts"), "utf8");

describe("org iam members page", () => {
  it("成员是独立子页面，旧部门 Tab 深链重定向到部门路由", () => {
    expect(pageSource).toContain("MemberTab");
    expect(pageSource).not.toContain("in-biz-tabs");
    expect(pageSource).not.toContain("DeptTab");
    expect(pageSource).toContain('org.iam.departments');
    expect(pageSource).toContain("departments");
    expect(memberOpsSource).toContain("active.value && !unavailable.value");
  });

  it("成员与部门树消费接口树，不分页拼树", () => {
    expect(pageSource).not.toContain("size: 200");
    expect(memberOpsSource).not.toContain("size: 200");
    expect(deptOpsSource).not.toContain("size: 200");
    expect(memberOpsSource).not.toContain("collectIamPageRecords");
    expect(deptOpsSource).not.toContain("collectIamPageRecords");
    expect(memberOpsSource).toContain("TenantDepartmentTreeAPI");
    expect(deptOpsSource).toContain("TenantDepartmentTreeAPI");
    expect(deptOpsSource).toContain("nestRootDepartmentChildren");
  });

  it("租户部门树固定带管理部门 purpose", () => {
    expect(apiSource).toContain("SelectionPurpose.MANAGED_DEPARTMENT");
    expect(apiSource).toContain("TenantDepartmentTreeAPI");
    expect(apiSource).toContain("{ purpose: SelectionPurpose.MANAGED_DEPARTMENT }");
  });

  it("导出走创建、状态轮询与下载三个接口", () => {
    expect(apiSource).toContain("TenantMemberExportStatusAPI");
    expect(apiSource).toContain("export/${id}/status");
    expect(memberTabSource).toContain("MemberExportDrawer");
  });
});
