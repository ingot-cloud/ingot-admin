import { describe, expect, it } from "vitest";
import { FieldVisibility } from "./constants";
import {
  fieldTextDraft,
  fieldTextPatch,
  isFieldFilterable,
  pruneFieldFilters,
} from "./fieldControl";

describe("公共字段交互", () => {
  const bindings = { contactPhone: "phone", name: "displayName", hidden: "secret" } as const;
  const access = {
    phone: { visibility: FieldVisibility.MASKED, editable: true },
    displayName: { visibility: FieldVisibility.FULL, editable: true },
    secret: { visibility: FieldVisibility.HIDDEN, editable: false },
  };
  const record = { contactPhone: "138****5678", name: "成员", hidden: "" };
  const initial = fieldTextDraft(record, bindings, access);

  it("脱敏编辑为空且不回传未改动字段，实际属性可以映射到逻辑键", () => {
    expect(initial.contactPhone).toBe("");
    expect(initial.name).toBe("成员");
    expect(fieldTextPatch(initial, initial, bindings, access, new Set(), new Set())).toEqual({});
    expect(
      fieldTextPatch(
        { ...initial, contactPhone: "13912345678" },
        initial,
        bindings,
        access,
        new Set(["contactPhone"]),
        new Set(["contactPhone"]),
      ),
    ).toEqual({ contactPhone: "13912345678" });
  });

  it("主动清空发送 null，隐藏字段与未知权限不提交", () => {
    expect(
      fieldTextPatch(
        initial,
        initial,
        bindings,
        access,
        new Set(["contactPhone", "hidden"]),
        new Set(["contactPhone", "hidden"]),
      ),
    ).toEqual({ contactPhone: null });
    expect(
      fieldTextPatch(
        initial,
        initial,
        bindings,
        {},
        new Set(["contactPhone"]),
        new Set(["contactPhone"]),
      ),
    ).toEqual({});
  });

  it("筛选按全局精确操作控制，权限变化剔除已生效条件并通知重置页码", () => {
    const operations = { read: { phone: { editable: false, filterable: false } } };
    expect(isFieldFilterable(operations, "other", "phone")).toBe(false);
    const result = pruneFieldFilters(
      { phone: "13812345678", status: "ACTIVE" },
      { phone: "phone" },
      operations,
      "read",
    );
    expect(result).toEqual({ condition: { status: "ACTIVE" }, changed: true });
  });
});
