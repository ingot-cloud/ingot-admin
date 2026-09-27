import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const createSource = readFileSync(resolve(dir, "MemberCreateDrawer.vue"), "utf8");
const detailSource = readFileSync(resolve(dir, "MemberDetailDrawer.vue"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../../api/iam/personnel.ts"), "utf8");

describe("platform personnel member drawers", () => {
  it("添加成员分两步且角色用户组选填", () => {
    expect(createSource).toContain("step === 1");
    expect(createSource).toContain("跳过并添加");
    expect(createSource).toContain("下一步");
    expect(createSource).toContain("上一步");
    expect(createSource).toContain("请选择角色");
    expect(createSource).toContain("请选择用户组");
    expect(createSource).toContain("roleIds");
    expect(createSource).toContain("groupIds");
    expect(createSource).toContain("loadPlatformRoleOptions");
    expect(createSource).toContain("loadPlatformGroupOptions");
    expect(createSource).toContain("AuthorizationDomain.PLATFORM");
    expect(createSource).toContain("AccountLookupPurpose.MEMBER_CREATE");
  });

  it("详情更多操作与列表溢出菜单一致，其他 Tab 预览用户组", () => {
    expect(detailSource).toContain("createRowActions");
    expect(detailSource).toContain("更多操作");
    expect(detailSource).toContain("is-danger");
    expect(detailSource).toContain('label="角色"');
    expect(detailSource).toContain('label="用户组"');
    expect(detailSource).toContain("collectIamPageRecords");
    expect(detailSource).toContain("PlatformMemberRolesReplaceAPI");
    expect(detailSource).not.toContain("<in-table");
    expect(apiSource).toContain("PlatformMemberRolesAPI");
    expect(apiSource).toContain("${MEMBER_PATH}/${id}/roles");
  });
});
