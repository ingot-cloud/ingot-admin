import { describe, expect, it } from "vitest";
import { isTableHeaderLocked, visibleHeaderProps, withTableHeaderDefaults } from "./columnVisibility";

describe("columnVisibility", () => {
  it("选择列、操作列和 required 列默认锁定", () => {
    expect(isTableHeaderLocked({ type: "selection", prop: "selection" })).toBe(true);
    expect(isTableHeaderLocked({ prop: "actions", label: "操作" })).toBe(true);
    expect(isTableHeaderLocked({ prop: "status", required: true })).toBe(true);
    expect(isTableHeaderLocked({ prop: "name", configurable: false })).toBe(true);
    expect(isTableHeaderLocked({ prop: "name" })).toBe(false);
  });

  it("为选择列和操作列补齐左右固定", () => {
    expect(withTableHeaderDefaults({ type: "selection", prop: "selection" }).fixed).toBe("left");
    expect(withTableHeaderDefaults({ prop: "actions" }).fixed).toBe("right");
  });

  it("状态列补齐最小宽度，过窄的 width 一并抬升", () => {
    expect(withTableHeaderDefaults({ prop: "status" }).minWidth).toBe(132);
    expect(withTableHeaderDefaults({ prop: "status", width: "80" })).toMatchObject({
      minWidth: 132,
      width: 132,
    });
    expect(withTableHeaderDefaults({ prop: "status", width: "180" }).width).toBe("180");
  });

  it("锁定列即使未选中也保持可见", () => {
    const headers = [
      { type: "selection" as const, prop: "selection" },
      { prop: "name", label: "名称" },
      { prop: "actions", label: "操作" },
    ];
    const visible = visibleHeaderProps(headers, ["name"]);
    expect(visible.map((item) => item.prop)).toEqual(["selection", "name", "actions"]);
  });
});
