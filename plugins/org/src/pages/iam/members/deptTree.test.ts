import { describe, expect, it } from "vitest";
import {
  buildDeptRows,
  collectExpandableDeptIds,
  departmentNameInitial,
  filterDeptTree,
  flattenRootDepartmentChildren,
  nestRootDepartmentChildren,
  isRootDepartment,
  CHILD_DEPT_ICON_SIZE,
  DEPT_TABLE_ROW_HEIGHT,
  DEPT_TREE_INDENT,
  DEPT_TREE_ROW_HEIGHT,
  ROOT_DEPT_AVATAR_SIZE,
  toDeptRow,
  toMemberDeptNode,
} from "./deptTree";
import type { ResourceDetail, DepartmentRecord, DepartmentTreeRow } from "@ingot/admin-common";

const detail = (
  id: string,
  name: string,
  sortOrder: number,
  parentId?: string,
): ResourceDetail<DepartmentRecord> => ({
  record: { id, name, sortOrder, navigationOnly: false, parentId, memberCount: 0 },
  fieldAccess: {},
  capabilities: {},
  version: "0",
});

describe("org iam members dept tree", () => {
  it("按 parentId 组装详情树", () => {
    const tree = buildDeptRows([detail("2", "研发", 2, "1"), detail("1", "总部", 1)]);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("1");
    expect(tree[0]?.children?.map((item) => item.id)).toEqual(["2"]);
  });

  it("命中子部门时保留祖先并展开路径", () => {
    const tree = buildDeptRows([
      detail("root", "总部", 1),
      detail("product", "产品部", 1, "root"),
      detail("a", "产品A组", 1, "product"),
    ]);
    const filtered = filterDeptTree(tree, "产品A");
    expect(filtered[0]?.name).toBe("总部");
    expect(filtered[0]?.children?.[0]?.name).toBe("产品部");
    expect(collectExpandableDeptIds(filtered)).toEqual(["root", "product"]);
  });

  it("根部门取名称首字且尺寸为 24", () => {
    expect(isRootDepartment({ parentId: undefined })).toBe(true);
    expect(isRootDepartment({ parentId: "1" })).toBe(false);
    expect(departmentNameInitial("英歌特云")).toBe("英");
    expect(departmentNameInitial(" 产品部")).toBe("产");
    expect(ROOT_DEPT_AVATAR_SIZE).toBe(24);
    expect(CHILD_DEPT_ICON_SIZE).toBe(14);
    expect(DEPT_TREE_ROW_HEIGHT).toBe(40);
    expect(DEPT_TABLE_ROW_HEIGHT).toBe(56);
    expect(DEPT_TREE_INDENT).toBe(16);
  });

  it("主部门与直属子部门平级，更深层仍挂在子部门下", () => {
    const tree = [
      {
        id: "root",
        name: "英歌特云",
        children: [
          {
            id: "product",
            parentId: "root",
            name: "产品部",
            children: [{ id: "a", parentId: "product", name: "产品A组" }],
          },
          { id: "rd", parentId: "root", name: "研发部" },
        ],
      },
    ];
    const flat = flattenRootDepartmentChildren(tree);
    expect(flat.map((item) => item.id)).toEqual(["root", "product", "rd"]);
    expect(flat[0]?.children).toBeUndefined();
    expect(flat[1]?.children?.map((item) => item.id)).toEqual(["a"]);
  });

  it("部门表把拍平的一级部门挂回主部门下", () => {
    const nested = nestRootDepartmentChildren([
      { id: "root", name: "英歌特云" },
      {
        id: "product",
        parentId: "root",
        name: "产品部",
        children: [{ id: "a", parentId: "product", name: "产品A组" }],
      },
      { id: "rd", parentId: "root", name: "研发部" },
    ]);
    expect(nested).toHaveLength(1);
    expect(nested[0]?.id).toBe("root");
    expect(nested[0]?.children?.map((item) => item.id)).toEqual(["product", "rd"]);
    expect(nested[0]?.children?.[0]?.children?.map((item) => item.id)).toEqual(["a"]);
  });

  it("把接口树节点转成左树与部门表行", () => {
    const node: DepartmentTreeRow = {
      record: { id: "1", name: "产品部", sortOrder: 1, navigationOnly: false, memberCount: 2 },
      fieldAccess: {},
      capabilities: {},
      version: "0",
      children: [
        {
          record: { id: "2", parentId: "1", name: "产品A组", sortOrder: 1, navigationOnly: false },
          fieldAccess: {},
          capabilities: {},
          version: "0",
          children: [],
        },
      ],
    };
    expect(toMemberDeptNode(node).children?.[0]?.id).toBe("2");
    expect(toDeptRow(node).memberCount).toBe(2);
    expect(toDeptRow(node).children?.[0]?.name).toBe("产品A组");
  });
});
