import { describe, expect, it } from "vitest";
import { delegationPeriodError } from "./delegationPeriod";

describe("委派时间校验", () => {
  it("允许不设委派起止边界，但要求单次分配最长时间", () => {
    expect(delegationPeriodError(undefined, undefined, "P1D")).toBeUndefined();
    expect(delegationPeriodError(undefined, undefined, undefined)).toContain("最长时间");
    expect(delegationPeriodError(undefined, undefined, "PT0S")).toContain("最长时间");
  });

  it("不限期限不要求时长，但仍拒绝倒置的来源期限", () => {
    expect(delegationPeriodError(undefined, undefined, undefined, "UNLIMITED")).toBeUndefined();
    expect(
      delegationPeriodError("2026-10-02T00:00:00Z", "2026-10-01T00:00:00Z", undefined, "UNLIMITED"),
    ).toContain("晚于");
  });

  it("拒绝倒置或相同的委派时间区间", () => {
    const from = "2026-10-02T09:00:00.000Z";
    expect(delegationPeriodError(from, from, "P1D")).toContain("晚于");
    expect(delegationPeriodError(from, "2026-10-01T09:00:00.000Z", "P1D")).toContain("晚于");
    expect(delegationPeriodError(from, "2026-10-03T09:00:00.000Z", "P1D")).toBeUndefined();
  });
});
