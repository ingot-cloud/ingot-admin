import { describe, expect, it } from "vitest";
import { DEFAULT_SKELETON_ROWS, resolveSkeletonRowCount } from "./resolveSkeletonRowCount";

describe("resolveSkeletonRowCount", () => {
  it("缺省或非法页大小时使用 8 行", () => {
    expect(resolveSkeletonRowCount()).toBe(DEFAULT_SKELETON_ROWS);
    expect(resolveSkeletonRowCount(0)).toBe(DEFAULT_SKELETON_ROWS);
  });

  it("不超过 8 行，避免整页骨架过长", () => {
    expect(resolveSkeletonRowCount(5)).toBe(5);
    expect(resolveSkeletonRowCount(20)).toBe(DEFAULT_SKELETON_ROWS);
  });
});
