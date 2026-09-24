import { describe, expect, it } from "vitest";
import { overflowCount, visibleMembers } from "./memberChipOverflow";

describe("memberChipOverflow", () => {
  it("未超过上限时全部展示且没有溢出", () => {
    const items = ["a", "b", "c"];
    expect(visibleMembers(items)).toEqual(items);
    expect(overflowCount(items.length)).toBe(0);
  });

  it("超过 5 个时只展示前 5 个，其余用 +N", () => {
    const items = ["1", "2", "3", "4", "5", "6", "7"];
    expect(visibleMembers(items)).toEqual(["1", "2", "3", "4", "5"]);
    expect(overflowCount(items.length)).toBe(2);
  });
});
