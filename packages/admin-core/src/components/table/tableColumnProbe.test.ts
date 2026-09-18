import { describe, expect, it } from "vitest";
import { isTableColumnProbe } from "./tableColumnProbe";

describe("isTableColumnProbe", () => {
  it("识别 Element Plus 列探测行", () => {
    expect(isTableColumnProbe({ row: {}, column: {}, $index: -1 })).toBe(true);
  });

  it("真实单元格不是探测行", () => {
    expect(isTableColumnProbe({ row: { name: "Ada" }, $index: 0 })).toBe(false);
    expect(isTableColumnProbe({ row: {}, $index: 1 })).toBe(false);
    expect(isTableColumnProbe(undefined)).toBe(false);
  });
});
