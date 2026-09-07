import { describe, expect, it } from "vitest";
import {
  ALL_PICKER_VALUE,
  resolveBooleanPickerFilter,
  resolveStringPickerFilter,
  toBooleanPickerValue,
  toStringPickerValue,
  withAllPickerOption,
} from "./pickerFilter";

describe("pickerFilter", () => {
  it("把空选映射为不传查询参数", () => {
    expect(toStringPickerValue(undefined)).toBe(ALL_PICKER_VALUE);
    expect(resolveStringPickerFilter("")).toBeUndefined();
    expect(resolveStringPickerFilter("0")).toBe("0");
    expect(toBooleanPickerValue(undefined)).toBe(ALL_PICKER_VALUE);
    expect(resolveBooleanPickerFilter("")).toBeUndefined();
    expect(resolveBooleanPickerFilter(false)).toBe(false);
  });

  it("在选项前补全部", () => {
    expect(withAllPickerOption([{ value: "1", label: "平台" }])).toEqual([
      { value: "", label: "全部" },
      { value: "1", label: "平台" },
    ]);
  });
});
