import { describe, expect, it } from "vitest";
import {
  applyMemberChanges,
  canRemoveDirectMembership,
  formatGroupSelectionSources,
  formatMembershipSources,
  MEMBERSHIP_DIRECT,
  MEMBERSHIP_HIDDEN_DEPARTMENT,
} from "./membership";

describe("group membership display", () => {
  it("拼接直接添加与部门来源，不可见部门不露名称", () => {
    expect(
      formatMembershipSources({
        direct: true,
        departments: [
          { id: "11", name: "研发", includeDescendants: false },
          { id: "12", includeDescendants: true },
        ],
      }),
    ).toBe(`${MEMBERSHIP_DIRECT}、研发、${MEMBERSHIP_HIDDEN_DEPARTMENT}（含下级）`);
  });

  it("组详情来源用部门名称，不展示 ID，直接成员记为直接添加", () => {
    const names = new Map([["11", "研发中心"]]);
    expect(
      formatGroupSelectionSources(
        [
          { id: "11", includeDescendants: true },
          { id: "12", includeDescendants: false },
        ],
        names,
        2,
      ),
    ).toBe(`研发中心（含下级）、${MEMBERSHIP_HIDDEN_DEPARTMENT}、${MEMBERSHIP_DIRECT}`);
    expect(formatGroupSelectionSources([], names, 0)).toBe("-");
    expect(formatGroupSelectionSources(undefined, names, 1)).toBe(MEMBERSHIP_DIRECT);
  });

  it("仅部门来源不可移出", () => {
    expect(canRemoveDirectMembership({ direct: false, departments: [{ id: "11", includeDescendants: false }] })).toBe(
      false,
    );
    expect(canRemoveDirectMembership({ direct: true, departments: [{ id: "11", includeDescendants: false }] })).toBe(
      true,
    );
  });

  it("在完整原集合上合成选人差量", () => {
    expect(
      applyMemberChanges(["1", "2", "3"], {
        added: [{ id: "4", name: "新" }],
        removedIds: ["2"],
      }),
    ).toEqual(["1", "3", "4"]);
  });
});
