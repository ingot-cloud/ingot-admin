import { describe, expect, it } from "vitest";
import { isVisibleUtilityBadge } from "./isVisibleUtilityBadge";

describe("isVisibleUtilityBadge", () => {
  it("数字 0 或字符串 0 不展示", () => {
    expect(isVisibleUtilityBadge(0)).toBe(false);
    expect(isVisibleUtilityBadge("0")).toBe(false);
    expect(isVisibleUtilityBadge("")).toBe(false);
    expect(isVisibleUtilityBadge(undefined)).toBe(false);
  });

  it("非零数量或文案角标展示", () => {
    expect(isVisibleUtilityBadge(3)).toBe(true);
    expect(isVisibleUtilityBadge("3")).toBe(true);
    expect(isVisibleUtilityBadge("NEW")).toBe(true);
  });
});
