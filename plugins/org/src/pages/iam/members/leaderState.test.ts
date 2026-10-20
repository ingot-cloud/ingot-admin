import { describe, expect, it } from "vitest";
import { MemberStatus, type DepartmentLeaderRecord } from "@ingot/admin-common";
import { departmentLeaderDelta, formatDepartmentLeaderSummary } from "./leaderState";

const member: DepartmentLeaderRecord = {
  memberId: "102",
  displayName: "研发主管",
  status: MemberStatus.ACTIVE,
  primary: false,
  available: true,
};

describe("部门负责人独立关系", () => {
  it("提交增删差量，不把未加载的负责人当成删除", () => {
    expect(departmentLeaderDelta("4", [member], new Set(["103"]), "102")).toEqual({
      expectedVersion: "4",
      addMemberIds: ["102"],
      removeMemberIds: ["103"],
      primaryMemberId: "102",
    });
  });
  it("未编辑主负责人时不提交设主，也不附带角色或数据范围", () => {
    expect(departmentLeaderDelta("4", [member], new Set())).toEqual({
      expectedVersion: "4",
      addMemberIds: ["102"],
      removeMemberIds: [],
    });
  });
  it("受限摘要不误报没有负责人或拼出隐藏人数", () => {
    for (const summary of [
      { visibleCount: 0, restricted: true },
      { visibleCount: 3, restricted: true },
      { primaryLeader: { ...member, primary: true }, visibleCount: 3, restricted: true },
    ]) {
      const label = formatDepartmentLeaderSummary(summary);
      expect(label).toContain("受限");
      expect(label).not.toContain("未设置");
      expect(label).not.toContain("3 人");
    }
  });
  it("不可用主负责人保留并提示交接", () => {
    expect(
      formatDepartmentLeaderSummary({
        primaryLeader: { ...member, primary: true, available: false },
        visibleCount: 1,
        restricted: false,
      }),
    ).toBe("研发主管（不可用，待交接）");
    expect(
      formatDepartmentLeaderSummary({
        primaryLeader: { ...member, primary: true, available: false },
        visibleCount: 3,
        restricted: false,
      }),
    ).toBe("研发主管（不可用，待交接） 等 3 人");
  });
});
