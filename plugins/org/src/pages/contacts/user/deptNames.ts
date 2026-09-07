import type { DeptTreeNode } from "@/models";

export const collectDeptNameMap = (nodes: Array<DeptTreeNode>): Map<string, string> => {
  const map = new Map<string, string>();
  const walk = (list: Array<DeptTreeNode>): void => {
    for (const node of list) {
      if (node.id) {
        map.set(node.id, node.name?.trim() || node.id);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return map;
};

export const resolveDeptNames = (
  ids: Array<string> | undefined,
  nodes: Array<DeptTreeNode>,
): Array<string> => {
  const map = collectDeptNameMap(nodes);
  return (ids ?? []).map((id) => map.get(id) ?? id);
};
