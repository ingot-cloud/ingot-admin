import { afterEach, describe, expect, it, vi } from "vitest";
import { browserTimeZone, formatDateTime, parseInstantDate, toApiInstant } from "./time";

afterEach(() => vi.restoreAllMocks());

describe("统一时间点交互", () => {
  it("将偏移量等价的时间点按指定时区显示，并处理午夜和夏令时", () => {
    expect(formatDateTime("2026-10-08T09:00:00+08:00", { timeZone: "UTC" })).toBe(
      "2026-10-08 01:00:00",
    );
    expect(formatDateTime("2026-10-08T01:00:00Z", { timeZone: "Asia/Shanghai" })).toBe(
      "2026-10-08 09:00:00",
    );
    expect(formatDateTime("2026-10-08T01:00:00Z", { timeZone: "America/New_York" })).toBe(
      "2026-10-07 21:00:00",
    );
    expect(formatDateTime("2026-10-07T16:00:00Z", { timeZone: "Asia/Shanghai" })).toBe(
      "2026-10-08 00:00:00",
    );
    expect(formatDateTime("2026-03-08T06:59:59Z", { timeZone: "America/New_York" })).toBe(
      "2026-03-08 01:59:59",
    );
    expect(formatDateTime("2026-03-08T07:00:00Z", { timeZone: "America/New_York" })).toBe(
      "2026-03-08 03:00:00",
    );
  });

  it("DatePicker 的本地选择提交为 UTC，展示不改写原始纳秒 ISO", () => {
    const value = "2026-10-08T09:00:00.123456789+08:00";
    expect(toApiInstant(parseInstantDate(value))).toBe("2026-10-08T01:00:00.123Z");
    expect(toApiInstant(parseInstantDate("2026-10-08T01:00:00.1Z"))).toBe(
      "2026-10-08T01:00:00.100Z",
    );
    expect(formatDateTime(value, { timeZone: "UTC" })).toBe("2026-10-08 01:00:00");
    expect(value).toBe("2026-10-08T09:00:00.123456789+08:00");
    expect(toApiInstant(null)).toBeUndefined();
    expect(() => toApiInstant(new Date("invalid"))).toThrow(RangeError);
  });

  it("拒绝旧墙钟、无偏移量和非法日历值，不把纯日期解释为时间点", () => {
    for (const value of [
      "2026-10-08 09:00:00",
      "2026-10-08T09:00:00",
      "2026-02-30T09:00:00Z",
      "2026-10-08T24:00:00Z",
      "2026-10-08",
      "PT24H",
      "invalid",
    ]) {
      expect(parseInstantDate(value)).toBeUndefined();
      expect(formatDateTime(value)).toBe("-");
    }
    expect(formatDateTime(undefined, { fallback: "长期" })).toBe("长期");
    expect(parseInstantDate("2024-02-29T09:00:00Z")).toBeDefined();
  });

  it("无法识别浏览器时区时回退上海", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("unavailable");
    });
    expect(browserTimeZone()).toBe("Asia/Shanghai");
  });
});
