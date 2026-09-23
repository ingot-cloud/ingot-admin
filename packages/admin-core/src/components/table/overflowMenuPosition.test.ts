import { describe, expect, it } from "vitest";
import { estimateOverflowMenuHeight, resolveOverflowMenuBox } from "./overflowMenuPosition";

describe("overflowMenuPosition", () => {
  it("下方空间足够时向下弹出", () => {
    const box = resolveOverflowMenuBox({
      trigger: { top: 80, bottom: 112, right: 960 },
      menuHeight: 160,
      viewport: { width: 1024, height: 768 },
    });
    expect(box.placement).toBe("bottom");
    expect(box.top).toBe(112);
    expect(box.bottom).toBeUndefined();
    expect(box.right).toBe(64);
    expect(box.maxHeight).toBe(320);
  });

  it("贴底且下方不够时改向上弹出", () => {
    const box = resolveOverflowMenuBox({
      trigger: { top: 700, bottom: 732, right: 980 },
      menuHeight: 180,
      viewport: { width: 1024, height: 768 },
    });
    expect(box.placement).toBe("top");
    expect(box.bottom).toBe(68);
    expect(box.top).toBeUndefined();
    expect(box.right).toBe(44);
    expect(box.maxHeight).toBeGreaterThanOrEqual(180);
  });

  it("两侧都不够时选空间更大的一侧并限制高度", () => {
    const box = resolveOverflowMenuBox({
      trigger: { top: 80, bottom: 740, right: 900 },
      menuHeight: 200,
      viewport: { width: 1024, height: 768 },
    });
    expect(box.placement).toBe("top");
    expect(box.maxHeight).toBe(68);
  });

  it("按条目数估算菜单高度", () => {
    expect(estimateOverflowMenuHeight(4)).toBeGreaterThan(estimateOverflowMenuHeight(1));
  });
});
