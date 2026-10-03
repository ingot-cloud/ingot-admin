import { describe, expect, it } from "vitest";
import {
  durationHours,
  formatDuration,
  hoursDuration,
  iamDateInstant,
  iamInstantDate,
} from "./duration";
describe("授权日期与 Duration", () => {
  it("本地墙钟带真实时区转换为 UTC，不伪造 Z", () => {
    expect(iamDateInstant(new Date("2026-09-28T10:30:00+08:00"))).toBe("2026-09-28T02:30:00.000Z");
    expect(iamInstantDate("2026-09-28T02:30:00Z")?.getTime()).toBe(
      new Date("2026-09-28T10:30:00+08:00").getTime(),
    );
  });
  it("天、小时及已有 ISO 期限都按准确秒值互转", () => {
    expect(durationHours("P30D")).toBe(720);
    expect(durationHours("PT1H30M")).toBe(1.5);
    expect(hoursDuration(1.5)).toBe("PT5400S");
    expect(durationHours(hoursDuration(48))).toBe(48);
  });

  it.each([
    ["PT24H", "1 天"],
    ["P30D", "30 天"],
    ["PT36H", "1 天 12 小时"],
    ["PT1H30M", "1 小时 30 分钟"],
    ["PT5400S", "1 小时 30 分钟"],
    ["PT90S", "1 分钟 30 秒"],
    ["PT0.5S", "0.5 秒"],
    ["P1DT2H3M4S", "1 天 2 小时 3 分钟 4 秒"],
    ["PT0S", "未设置"],
    ["invalid", "未设置"],
    [undefined, "未设置"],
  ])("期限 %s 显示为 %s", (duration, label) => {
    expect(formatDuration(duration)).toBe(label);
  });
});
