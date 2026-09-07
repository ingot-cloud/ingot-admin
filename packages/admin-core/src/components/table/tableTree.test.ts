import { describe, expect, it } from "vitest";
import { collectTreeLevels, flattenTreeRows, treeRowHasChildren } from "./tableTree";

const tree = [
  {
    id: "root",
    children: [
      { id: "a", children: [{ id: "a1" }] },
      { id: "b" },
    ],
  },
];

const rowKey = (row: Record<string, unknown>): string => String(row.id ?? "");

describe("InTable tree helpers", () => {
  it("计算层级并扁平化", () => {
    const levels = collectTreeLevels(tree, { childrenKey: "children", rowKey });
    expect(levels.get("root")).toBe(0);
    expect(levels.get("a")).toBe(1);
    expect(levels.get("a1")).toBe(2);
    expect(flattenTreeRows(tree, "children").map((item) => item.id)).toEqual(["root", "a", "a1", "b"]);
  });

  it("判断是否有子节点", () => {
    expect(treeRowHasChildren(tree[0]!, "children")).toBe(true);
    expect(treeRowHasChildren({ id: "leaf" }, "children")).toBe(false);
    expect(treeRowHasChildren({ id: "lazy", hasChildren: true }, "children")).toBe(true);
  });
});
