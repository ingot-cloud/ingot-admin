import { describe, expect, it } from "vitest";
import { DESCRIPTION_EMPTY, formatDescriptionValue } from "./formatDescriptionValue";

describe("formatDescriptionValue", () => {
  it("空值显示短横线", () => {
    expect(formatDescriptionValue(undefined)).toBe(DESCRIPTION_EMPTY);
    expect(formatDescriptionValue(null)).toBe(DESCRIPTION_EMPTY);
    expect(formatDescriptionValue("")).toBe(DESCRIPTION_EMPTY);
    expect(formatDescriptionValue("  ")).toBe(DESCRIPTION_EMPTY);
    expect(formatDescriptionValue([])).toBe(DESCRIPTION_EMPTY);
  });

  it("数组用顿号拼接", () => {
    expect(formatDescriptionValue(["产品部", "研发部"])).toBe("产品部、研发部");
  });

  it("保留有效文本", () => {
    expect(formatDescriptionValue("王超")).toBe("王超");
  });
});
