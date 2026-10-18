import { describe, expect, it } from "vitest";
import {
  flattenDepartmentChoices,
  mergeDepartmentSelection,
  sameDepartmentOrder,
  toDepartmentViews,
} from "./departmentSelection";

describe("departmentSelection", () => {
  const tree = flattenDepartmentChoices([
    {
      id: "root",
      name: "公司",
      parentId: undefined,
      sortOrder: 0,
      navigationOnly: false,
      children: [
        { id: "eng", name: "工程", sortOrder: 0, navigationOnly: false },
        { id: "ops", name: "运营", sortOrder: 1, navigationOnly: false },
      ],
    },
  ]);

  it("根部门路径是自身，下级路径是上级链", () => {
    expect(tree.find((item) => item.id === "root")?.path).toBe("公司");
    expect(tree.find((item) => item.id === "eng")?.path).toBe("公司");
  });

  it("新勾选按树前序追加，取消勾选保持其余顺序", () => {
    const current = [
      { id: "ops", name: "运营", path: "公司" },
      { id: "missing", name: "已不在树中", path: "已不在树中" },
    ];
    const merged = mergeDepartmentSelection(current, new Set(["ops", "eng", "missing"]), tree);
    expect(merged.map((item) => item.id)).toEqual(["ops", "missing", "eng"]);
    expect(merged.find((item) => item.id === "eng")?.path).toBe("公司");
  });

  it("第一项为主部门，顺序变化才视为已修改", () => {
    const views = toDepartmentViews([
      { id: "ops", name: "运营", path: "公司" },
      { id: "eng", name: "工程", path: "公司" },
    ]);
    expect(views[0]?.primary).toBe(true);
    expect(views[1]?.primary).toBe(false);
    expect(sameDepartmentOrder(views, [{ id: "ops" }, { id: "eng" }])).toBe(true);
    expect(sameDepartmentOrder(views, [{ id: "eng" }, { id: "ops" }])).toBe(false);
  });
});
