import { describe, expect, it } from "vitest";
import { memberIdsForScope, type ExportScopePage } from "./exportScope";

describe("memberIdsForScope", () => {
  it("部门选择包含本部门和下级部门的成员，并与单独成员去重", async () => {
    const members: Record<string, string[]> = {
      d1: ["m1"],
      d2: ["m2", "m1"],
    };
    const children: Record<string, string[]> = { d1: ["d2"] };
    const ids = await memberIdsForScope(
      {
        departments: [{ id: "d1", name: "产品部" }],
        members: [{ id: "m9", name: "王超" }],
      },
      {
        loadMembers: async (departmentId, page) => pageOf(page, members[departmentId] ?? []),
        loadChildren: async (departmentId, page) => pageOf(page, children[departmentId] ?? []),
      },
    );
    expect(ids).toEqual(["m9", "m1", "m2"]);
  });

  it("空部门不产生成员", async () => {
    const ids = await memberIdsForScope(
      { departments: [{ id: "d1", name: "空部门" }], members: [] },
      {
        loadMembers: async (_departmentId, page) => pageOf(page, []),
        loadChildren: async (_departmentId, page) => pageOf(page, []),
      },
    );
    expect(ids).toEqual([]);
  });
});

function pageOf(page: number, ids: string[]): ExportScopePage<{ id: string }> {
  return {
    records: page === 1 ? ids.map((id) => ({ id })) : [],
    total: ids.length,
    size: 20,
  };
}
