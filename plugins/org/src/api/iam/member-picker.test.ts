import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantOrganizationMemberBrowseAPI } from "./directory";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@ingot/admin-core", async () => ({
  ...(await import("../../../../../packages/admin-core/src/utils/object")),
  request: { get },
}));
vi.mock("@ingot/admin-common", async () => ({
  ...(await import("../../../../../packages/admin-common/src/models/iam/constants")),
  ...(await import("../../../../../packages/admin-common/src/models/iam/helpers")),
}));
beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({
    data: {
      navigationAvailable: true,
      navigation: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        breadcrumbs: [],
        organization: { id: "1", name: "组织" },
      },
      members: {
        items: [
          {
            id: "101",
            name: "未分配",
            available: true,
            departments: [],
            implicitRoot: { id: "1", name: "组织" },
          },
          {
            id: "102",
            name: "双任职",
            available: true,
            departments: [
              { id: "1", name: "组织" },
              { id: "11", name: "研发" },
            ],
          },
          { id: "103", available: true, departments: [] },
        ],
        total: 3,
        page: 2,
        pageSize: 20,
      },
    },
  });
});
describe("组织成员专用浏览适配", () => {
  it("负责人目标、浏览分支和两个分页分别透传，回显复用真实任职或显式虚拟根", async () => {
    const signal = new AbortController().signal;
    const response = await TenantOrganizationMemberBrowseAPI(
      {
        scene: "DEPARTMENT_LEADER",
        targetDepartmentId: "15",
        departmentId: "11",
        current: 2,
        departmentPage: 3,
      },
      { signal },
    );
    expect(get).toHaveBeenCalledWith(
      "/api/iam/v1/tenant/member-picker/browse",
      expect.objectContaining({
        scene: "DEPARTMENT_LEADER",
        targetDepartmentId: "15",
        departmentId: "11",
        page: 2,
        pageSize: 20,
        departmentPage: 3,
        departmentPageSize: 20,
      }),
      { signal },
    );
    expect(response.data.members.records?.map((item) => [item.name, item.summary])).toEqual([
      ["未分配", "组织"],
      ["双任职", "组织、研发"],
      ["姓名受限", undefined],
    ]);
    expect(get).toHaveBeenCalledTimes(1);
  });
  it("委派候选传递原来源，不能改成普通成员场景", async () => {
    await TenantOrganizationMemberBrowseAPI({
      scene: "ASSIGNMENT",
      delegationGrantId: "61",
      query: "张",
    });
    expect(get).toHaveBeenCalledWith(
      "/api/iam/v1/tenant/member-picker/browse",
      expect.objectContaining({ scene: "ASSIGNMENT", delegationGrantId: "61", keyword: "张" }),
      undefined,
    );
  });
});
