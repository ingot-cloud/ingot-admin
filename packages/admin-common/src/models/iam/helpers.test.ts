import { describe, expect, it } from "vitest";
import { ConfigurationStatus, FieldVisibility, IAM_MASKED_PLACEHOLDER } from "./constants";
import { editablePatch, isFieldEditable, isMaskedValue, mapIamPage, toIamListParams } from "./helpers";

describe("iam helpers", () => {
  it("脱敏占位不进入提交 patch", () => {
    const access = {
      phone: { visibility: FieldVisibility.MASKED, editable: false },
      displayName: { visibility: FieldVisibility.FULL, editable: true },
    };
    expect(isMaskedValue(IAM_MASKED_PLACEHOLDER)).toBe(true);
    expect(isFieldEditable(access, "displayName")).toBe(true);
    expect(isFieldEditable(access, "phone")).toBe(false);
    expect(
      editablePatch(
        { displayName: "张三", phone: IAM_MASKED_PLACEHOLDER },
        access,
        ["displayName", "phone"],
      ),
    ).toEqual({ displayName: "张三" });
  });

  it("把 items/page 映射到现有分页模型", () => {
    expect(
      mapIamPage({
        items: [{ id: "1" }],
        total: 1,
        page: 2,
        pageSize: 20,
      }),
    ).toEqual({
      current: 2,
      size: 20,
      total: 1,
      records: [{ id: "1" }],
    });
    expect(toIamListParams({ current: 3, size: 10 }, { name: "a" })).toEqual({
      page: 3,
      pageSize: 10,
      name: "a",
    });
    expect(ConfigurationStatus.ENABLED).toBe("ENABLED");
  });
});
