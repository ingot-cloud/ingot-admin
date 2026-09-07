import { describe, expect, it } from "vitest";
import { collectExpandableDeptIds, filterDeptTree } from "./deptTree";
import type { DeptTreeNodeWithManagerVO } from "@/models";

const tree: Array<DeptTreeNodeWithManagerVO> = [
  {
    id: "root",
    name: "英格特云",
    mainFlag: true,
    children: [
      {
        id: "product",
        name: "产品部",
        children: [{ id: "a", name: "产品A组" }],
      },
      { id: "rd", name: "研发部" },
    ],
  },
];

describe("org contacts dept tree filter", () => {
  it("空关键字返回原树", () => {
    expect(filterDeptTree(tree, "  ")).toEqual(tree);
  });

  it("命中子部门时保留祖先，并展开路径", () => {
    const filtered = filterDeptTree(tree, "产品A");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("英格特云");
    expect(filtered[0]?.children?.map((item) => item.name)).toEqual(["产品部"]);
    expect(filtered[0]?.children?.[0]?.children?.map((item) => item.name)).toEqual(["产品A组"]);
    expect(collectExpandableDeptIds(filtered)).toEqual(["root", "product"]);
  });

  it("命中父部门时保留完整子树", () => {
    expect(filterDeptTree(tree, "产品部")[0]?.children?.[0]?.children?.map((item) => item.name)).toEqual(
      ["产品A组"],
    );
  });
});
