import { describe, expect, it } from "vitest";
import {
  applyColumnSelection,
  canReorderTableHeader,
  isTableHeaderLocked,
  normalizeColumnSettingPreference,
  visibleHeaderProps,
  withTableHeaderDefaults,
} from "./columnVisibility";

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

  it("必选列可调序，选择列和操作列不可拖拽", () => {
    expect(canReorderTableHeader({ prop: "name", required: true })).toBe(true);
    expect(canReorderTableHeader({ type: "selection", prop: "selection" })).toBe(false);
    expect(canReorderTableHeader({ prop: "actions", label: "操作" })).toBe(false);
  });

  it("兼容旧的选中数组持久化，并保留对象格式的顺序", () => {
    const fallback = { selected: ["name"], order: ["name", "phone"] };
    expect(normalizeColumnSettingPreference(["phone", "name"], fallback)).toEqual({
      selected: ["phone", "name"],
      order: ["name", "phone"],
    });
    expect(
      normalizeColumnSettingPreference({ selected: ["phone"], order: ["phone", "name"] }, fallback),
    ).toEqual({ selected: ["phone"], order: ["phone", "name"] });
  });

  it("按选中顺序重排中间列，选择列和操作列仍钉在两端", () => {
    const headers = [
      { prop: "name", label: "名称", required: true },
      { prop: "phone", label: "手机号" },
      { prop: "email", label: "邮箱" },
      { prop: "actions", label: "操作" },
    ];
    const next = applyColumnSelection(headers, ["email", "name", "actions"]);
    expect(next.map((item) => item.prop)).toEqual(["email", "name", "phone", "actions"]);
    expect(next.find((item) => item.prop === "phone")?.hide).toBe(true);
  });

  it("必选姓名和状态在只选手机号时仍可见", () => {
    const headers = [
      { prop: "avatar", label: "姓名", required: true },
      { prop: "status", label: "状态", required: true },
      { prop: "phone", label: "手机号" },
      { prop: "email", label: "邮箱" },
      { prop: "actions", label: "操作" },
    ];
    const next = applyColumnSelection(headers, ["phone"]);
    expect(next.map((item) => item.prop)).toEqual(["phone", "avatar", "status", "email", "actions"]);
    expect(next.find((item) => item.prop === "avatar")?.hide).toBe(false);
    expect(next.find((item) => item.prop === "status")?.hide).toBe(false);
    expect(next.find((item) => item.prop === "email")?.hide).toBe(true);
  });
});
