import { describe, expect, it } from "vitest";
import { allocateHeaderOverflow } from "./allocateHeaderOverflow";
import { InAdminHeaderBuiltinUtilityName } from "@/plugin/header";

const keys = (...list: string[]) => list.map((key) => ({ key, width: 80 }));
const fullscreen = InAdminHeaderBuiltinUtilityName.Fullscreen;
const settings = InAdminHeaderBuiltinUtilityName.Settings;

describe("allocateHeaderOverflow", () => {
  const base = {
    navSlotWidth: 0,
    searchEnabled: true,
    searchFullWidth: 240,
    searchCompactWidth: 32,
    utilitySlotWidth: 0,
    moreButtonWidth: 32,
    itemGap: 12,
    zoneGap: 12,
  };

  it("宽度足够时全部直出", () => {
    const result = allocateHeaderOverflow({
      ...base,
      availableWidth: 1200,
      navItems: keys("a", "b", "c"),
      utilityItems: keys(fullscreen, settings),
    });
    expect(result.visibleNavKeys).toEqual(["a", "b", "c"]);
    expect(result.overflowNavKeys).toEqual([]);
    expect(result.searchCompact).toBe(false);
    expect(result.visibleUtilityKeys).toEqual([fullscreen, settings]);
    expect(result.showNavMore).toBe(false);
    expect(result.showUtilityMore).toBe(false);
  });

  it("优先保留选中入口，其余按原顺序填充", () => {
    const result = allocateHeaderOverflow({
      ...base,
      availableWidth: 80 + 12 + 80 + 12 + 32 + 12 + 240 + 12 + 80 + 12 + 80,
      navItems: keys("a", "b", "c", "d"),
      activeNavKey: "c",
      utilityItems: keys(fullscreen, settings),
    });
    expect(result.visibleNavKeys).toContain("c");
    expect(result.visibleNavKeys).toEqual([...result.visibleNavKeys].sort((left, right) => {
      const order = ["a", "b", "c", "d"];
      return order.indexOf(left) - order.indexOf(right);
    }));
    expect(result.overflowNavKeys.every((key) => !result.visibleNavKeys.includes(key))).toBe(
      true,
    );
  });

  it("可见入口非空时至少保留一个，并预留更多按钮", () => {
    const result = allocateHeaderOverflow({
      ...base,
      availableWidth: 80 + 12 + 32 + 12 + 240 + 12 + 80 + 12 + 80,
      navItems: keys("a", "b", "c"),
      utilityItems: keys(fullscreen, settings),
    });
    expect(result.visibleNavKeys.length).toBeGreaterThanOrEqual(1);
    expect(result.showNavMore).toBe(true);
    expect(result.overflowNavKeys.length).toBeGreaterThan(0);
  });

  it("放不下一个菜单加完整右侧时先把搜索变图标，再收纳小部件", () => {
    const oneNavAndRight =
      80 + 12 + 32 + 12 + 240 + 12 + 80 + 12 + 80;
    const compactSearch =
      80 + 12 + 32 + 12 + 32 + 12 + 80 + 12 + 80;
    const afterOneUtility =
      80 + 12 + 32 + 12 + 32 + 12 + 80 + 12 + 32;

    const compact = allocateHeaderOverflow({
      ...base,
      availableWidth: compactSearch,
      navItems: keys("a", "b"),
      utilityItems: keys(fullscreen, settings),
    });
    expect(compact.visibleNavKeys.length).toBe(1);
    expect(compact.searchCompact).toBe(true);
    expect(compact.visibleUtilityKeys).toEqual([fullscreen, settings]);

    const overflowUtils = allocateHeaderOverflow({
      ...base,
      availableWidth: afterOneUtility,
      navItems: keys("a", "b"),
      utilityItems: keys(fullscreen, settings),
    });
    expect(overflowUtils.searchCompact).toBe(true);
    expect(overflowUtils.overflowUtilityKeys).toEqual([settings]);
    expect(overflowUtils.visibleUtilityKeys).toEqual([fullscreen]);
    expect(overflowUtils.showUtilityMore).toBe(true);
    expect(oneNavAndRight).toBeGreaterThan(compactSearch);
  });

  it("大类项间距按 navItemGap 计算，不影响小部件间距", () => {
    const threeNavAndRight =
      80 + 12 + 80 + 12 + 80 + 12 + 240 + 12 + 80 + 12 + 80;
    const tight = allocateHeaderOverflow({
      ...base,
      availableWidth: threeNavAndRight,
      navItems: keys("a", "b", "c"),
      utilityItems: keys(fullscreen, settings),
    });
    const wideNavGap = allocateHeaderOverflow({
      ...base,
      navItemGap: 24,
      availableWidth: threeNavAndRight,
      navItems: keys("a", "b", "c"),
      utilityItems: keys(fullscreen, settings),
    });
    expect(tight.overflowNavKeys).toEqual([]);
    expect(wideNavGap.overflowNavKeys.length).toBeGreaterThan(0);
  });

  it("导航为空时不出现更多按钮", () => {
    const result = allocateHeaderOverflow({
      ...base,
      availableWidth: 400,
      navItems: [],
      utilityItems: keys(fullscreen),
    });
    expect(result.visibleNavKeys).toEqual([]);
    expect(result.showNavMore).toBe(false);
    expect(result.searchCompact).toBe(false);
  });

  it("旧插槽作为不可拆整体收纳", () => {
    const result = allocateHeaderOverflow({
      ...base,
      availableWidth: 80 + 12 + 32 + 12 + 32 + 12 + 32,
      navItems: keys("a"),
      navSlotWidth: 200,
      searchEnabled: true,
      utilityItems: [],
      utilitySlotWidth: 0,
    });
    expect(result.visibleNavKeys).toEqual(["a"]);
    expect(result.overflowNavSlot).toBe(true);
    expect(result.showNavMore).toBe(true);
    expect(result.searchCompact).toBe(true);
  });
});
