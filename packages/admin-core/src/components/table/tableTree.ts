export type TreeRowKeyFn = (row: Record<string, unknown>) => string;

const asTreeRows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];

export const collectTreeLevels = (
  nodes: Array<Record<string, unknown>>,
  options: { childrenKey: string; rowKey: TreeRowKeyFn },
): Map<string, number> => {
  const map = new Map<string, number>();
  const walk = (list: Array<Record<string, unknown>>, level: number): void => {
    for (const node of list) {
      const id = options.rowKey(node);
      if (id) {
        map.set(id, level);
      }
      walk(asTreeRows(node[options.childrenKey]), level + 1);
    }
  };
  walk(nodes, 0);
  return map;
};

export const flattenTreeRows = (
  nodes: Array<Record<string, unknown>>,
  childrenKey: string,
): Array<Record<string, unknown>> => {
  const list: Array<Record<string, unknown>> = [];
  const walk = (items: Array<Record<string, unknown>>): void => {
    for (const node of items) {
      list.push(node);
      walk(asTreeRows(node[childrenKey]));
    }
  };
  walk(nodes);
  return list;
};

export const treeRowHasChildren = (
  row: Record<string, unknown>,
  childrenKey: string,
  hasChildrenKey = "hasChildren",
): boolean => {
  if (asTreeRows(row[childrenKey]).length > 0) {
    return true;
  }
  return Boolean(row[hasChildrenKey]);
};
