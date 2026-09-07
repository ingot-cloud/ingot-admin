import { describe, expect, it } from "vitest";
import { asCheckboxMode, isTreeCheckboxEnabled, resolveRowCheckboxMode } from "./checkboxMode";

describe("InTable checkbox mode", () => {
  it("把布尔值映射为三态，未传时回退 fallback", () => {
    expect(asCheckboxMode(true)).toBe("on");
    expect(asCheckboxMode(false)).toBe("off");
    expect(asCheckboxMode("disabled")).toBe("disabled");
    expect(asCheckboxMode(undefined)).toBe("off");
    expect(asCheckboxMode(undefined, "on")).toBe("on");
  });

  it("checkbox 为 off 或未传时不启用树列多选", () => {
    expect(isTreeCheckboxEnabled(undefined)).toBe(false);
    expect(isTreeCheckboxEnabled("off")).toBe(false);
    expect(isTreeCheckboxEnabled("on")).toBe(true);
    expect(isTreeCheckboxEnabled("disabled")).toBe(true);
    expect(isTreeCheckboxEnabled(() => "off")).toBe(true);
  });

  it("按行解析三态，函数结果优先", () => {
    expect(resolveRowCheckboxMode("on", { id: "1" })).toBe("on");
    expect(resolveRowCheckboxMode((row: { root?: boolean }) => (row.root ? "off" : "on"), { root: true })).toBe(
      "off",
    );
    expect(resolveRowCheckboxMode(undefined, {})).toBe("off");
  });
});
