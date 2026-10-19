import { describe, expect, it } from "vitest";
import {
  flattenDepartmentChoices,
  departmentSubtreeIds,
  mergeDepartmentSelection,
  moveDepartmentChoice,
  sameDepartmentOrder,
  toDepartmentViews,
  withCatalogPaths,
  withDepartmentDisplays,
} from "./departmentSelection";

describe("departmentSelection", () => {
  it("上级选择排除自身及子树，兄弟与根仍可选", () => {
    const tree = [
      {
        id: "root",
        name: "公司",
        sortOrder: 0,
        navigationOnly: false,
        children: [
          {
            id: "self",
            name: "研发",
            sortOrder: 0,
            navigationOnly: false,
            children: [{ id: "child", name: "研发组", sortOrder: 0, navigationOnly: false }],
          },
          { id: "sibling", name: "产品", sortOrder: 0, navigationOnly: false },
        ],
      },
    ];
    expect([...departmentSubtreeIds(tree, "self")]).toEqual(["self", "child"]);
    expect(departmentSubtreeIds(tree)).toEqual(new Set());
  });
  const tree = flattenDepartmentChoices([
    {
      id: "root",
      name: "公司",
      parentId: undefined,
      sortOrder: 0,
      navigationOnly: false,
      children: [
        { id: "eng", name: "工程", parentId: "root", sortOrder: 0, navigationOnly: false },
        { id: "ops", name: "运营", parentId: "root", sortOrder: 1, navigationOnly: false },
      ],
    },
  ]);

  it("根部门没有路径，下级路径含自身", () => {
    expect(tree.find((item) => item.id === "root")?.path).toBe("");
    expect(tree.find((item) => item.id === "eng")?.path).toBe("公司/工程");
  });

  it("拍平的一级部门也能拼出含自身的路径", () => {
    const flattened = flattenDepartmentChoices([
      { id: "root", name: "公司", sortOrder: 0, navigationOnly: false },
      { id: "eng", name: "工程", parentId: "root", sortOrder: 1, navigationOnly: false },
    ]);
    expect(flattened.find((item) => item.id === "eng")?.path).toBe("公司/工程");
  });

  it("新勾选按树前序追加，取消勾选保持其余顺序", () => {
    const current = [
      { id: "ops", name: "运营", path: "公司/运营" },
      { id: "missing", name: "已不在树中", path: "已不在树中" },
    ];
    const merged = mergeDepartmentSelection(current, new Set(["ops", "eng", "missing"]), tree);
    expect(merged.map((item) => item.id)).toEqual(["ops", "missing", "eng"]);
    expect(merged.find((item) => item.id === "eng")?.path).toBe("公司/工程");
  });

  it("树外部门不补路径", () => {
    expect(
      withCatalogPaths([{ id: "missing", name: "已不在树中", path: "已不在树中" }], tree),
    ).toEqual([{ id: "missing", name: "已不在树中", path: "" }]);
  });

  it("详情展示主部门在前并补路径", () => {
    const displays = withDepartmentDisplays(
      [
        { id: "eng", name: "工程", primary: false },
        { id: "ops", name: "运营", primary: true },
      ],
      tree,
    );
    expect(displays.map((item) => item.id)).toEqual(["ops", "eng"]);
    expect(displays[0]?.path).toBe("公司/运营");
    expect(displays[1]?.path).toBe("公司/工程");
  });

  it("拖动已选部门后第一项为主部门", () => {
    const moved = moveDepartmentChoice(tree, "ops", "root");
    expect(moved.map((item) => item.id)).toEqual(["ops", "root", "eng"]);
    expect(toDepartmentViews(moved)[0]?.primary).toBe(true);
    expect(toDepartmentViews(moved)[0]?.id).toBe("ops");
  });

  it("第一项为主部门，顺序变化才视为已修改", () => {
    const views = toDepartmentViews([
      { id: "ops", name: "运营", path: "公司/运营" },
      { id: "eng", name: "工程", path: "公司/工程" },
    ]);
    expect(views[0]?.primary).toBe(true);
    expect(views[1]?.primary).toBe(false);
    expect(sameDepartmentOrder(views, [{ id: "ops" }, { id: "eng" }])).toBe(true);
    expect(sameDepartmentOrder(views, [{ id: "eng" }, { id: "ops" }])).toBe(false);
  });
});
