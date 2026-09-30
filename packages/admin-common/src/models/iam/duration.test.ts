import { describe, expect, it } from "vitest";
import { durationHours, hoursDuration, iamDateInstant, iamInstantDate } from "./duration";
describe("授权日期与 Duration", () => {
  it("本地墙钟带真实时区转换为 UTC，不伪造 Z", () => {
    expect(iamDateInstant(new Date("2026-09-28T10:30:00+08:00"))).toBe("2026-09-28T02:30:00.000Z");
    expect(iamInstantDate("2026-09-28T02:30:00Z")?.getTime()).toBe(new Date("2026-09-28T10:30:00+08:00").getTime());
  });
  it("天、小时及已有 ISO 期限都按准确秒值互转", () => {
    expect(durationHours("P30D")).toBe(720);
    expect(durationHours("PT1H30M")).toBe(1.5);
    expect(hoursDuration(1.5)).toBe("PT5400S");
    expect(durationHours(hoursDuration(48))).toBe(48);
  });
});
