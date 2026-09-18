import { describe, expect, it } from "vitest";
import { ConfigurationStatus, FieldVisibility, IAM_MASKED_PLACEHOLDER } from "./constants";
import {
  buildDepartmentTree,
  collectIamPageRecords,
  editablePatch,
  isFieldEditable,
  isMaskedValue,
  mapIamPage,
  toIamListParams,
} from "./helpers";
import type { DepartmentRecord } from "./types";

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

  it("按默认页大小逐页收齐记录", async () => {
    const pages = [
      { records: ["a", "b"], total: 3 },
      { records: ["c"], total: 3 },
    ];
    const sizes: number[] = [];
    const records = await collectIamPageRecords(async (page) => {
      sizes.push(page.size ?? 0);
      return { data: pages[(page.current ?? 1) - 1] ?? { records: [], total: 0 } };
    }, 2);
    expect(records).toEqual(["a", "b", "c"]);
    expect(sizes).toEqual([2, 2]);
  });

  it("按 parentId 组装部门树，缺父节点的落为根", () => {
    const records: DepartmentRecord[] = [
      { id: "2", parentId: "1", name: "研发", sortOrder: 2, navigationOnly: false },
      { id: "1", name: "总部", sortOrder: 1, navigationOnly: false },
      { id: "9", parentId: "missing", name: "孤立", sortOrder: 3, navigationOnly: true },
    ];
    expect(buildDepartmentTree(records)).toEqual([
      { id: "1", name: "总部", children: [{ id: "2", name: "研发" }] },
      { id: "9", name: "孤立" },
    ]);
  });
});
