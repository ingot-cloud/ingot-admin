import { describe, expect, it } from "vitest";
import { fieldPermissionChanges } from "./roleFields";
import { FieldVisibility } from "./constants";
describe("固定版本字段变化", () => {
  it("显示安全默认、新权限和删除的字段，不改变快照", () => {
    const snapshot = {
      "10": {
        visibility: { phone: FieldVisibility.FULL },
        operations: { phone: { editable: false, filterable: false } },
      },
    };
    expect(fieldPermissionChanges(undefined, snapshot)[0]).toMatchObject({
      before: "未声明／隐藏",
      after: "完整可见，只读",
    });
    expect(fieldPermissionChanges(snapshot, {})[0].after).toBe("未声明／隐藏");
    expect(fieldPermissionChanges(snapshot, snapshot)).toEqual([]);
  });
});
