import type { DeptTreeNodeWithManagerVO } from "@/models";

const asDeptNodes = (nodes?: Array<DeptTreeNodeWithManagerVO>): Array<DeptTreeNodeWithManagerVO> =>
  nodes ?? [];

export const filterDeptTree = (
  nodes: Array<DeptTreeNodeWithManagerVO>,
  keyword: string,
): Array<DeptTreeNodeWithManagerVO> => {
  const query = keyword.trim().toLowerCase();
  if (!query) {
    return nodes;
  }
  const walk = (list: Array<DeptTreeNodeWithManagerVO>): Array<DeptTreeNodeWithManagerVO> => {
    const next: Array<DeptTreeNodeWithManagerVO> = [];
    for (const node of list) {
      const originChildren = asDeptNodes(
        node.children as Array<DeptTreeNodeWithManagerVO> | undefined,
      );
      const matched = (node.name ?? "").toLowerCase().includes(query);
      const children = walk(originChildren);
      if (matched) {
        next.push({ ...node, children: originChildren });
      } else if (children.length > 0) {
        next.push({ ...node, children });
      }
    }
    return next;
  };
  return walk(nodes);
};

export const collectExpandableDeptIds = (
  nodes: Array<DeptTreeNodeWithManagerVO>,
): Array<string> => {
  const keys: Array<string> = [];
  const walk = (list: Array<DeptTreeNodeWithManagerVO>): void => {
    for (const node of list) {
      const children = asDeptNodes(node.children as Array<DeptTreeNodeWithManagerVO> | undefined);
      if (node.id && children.length > 0) {
        keys.push(node.id);
        walk(children);
      }
    }
  };
  walk(nodes);
  return keys;
};
