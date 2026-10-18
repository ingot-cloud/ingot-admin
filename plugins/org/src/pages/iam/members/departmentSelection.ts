import type { DepartmentTreeNode, MemberDepartmentView } from "@ingot/admin-common";

export interface DepartmentChoice {
  id: string;
  name: string;
  /** 上级路径；根部门用自身名称。 */
  path: string;
}

export function flattenDepartmentChoices(nodes: DepartmentTreeNode[]): DepartmentChoice[] {
  const items: DepartmentChoice[] = [];
  const walk = (list: DepartmentTreeNode[], ancestors: string[]): void => {
    for (const node of list) {
      items.push({
        id: node.id,
        name: node.name,
        path: ancestors.length > 0 ? ancestors.join("/") : node.name,
      });
      if (node.children?.length) {
        walk(node.children, [...ancestors, node.name]);
      }
    }
  };
  walk(nodes, []);
  return items;
}

/** 用当前树补齐名称和路径；树外部门保留原名称。 */
export function withCatalogPaths(
  items: DepartmentChoice[],
  catalog: DepartmentChoice[],
): DepartmentChoice[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return items.map((item) => {
    const known = byId.get(item.id);
    if (!known) {
      return { ...item, path: item.path || item.name };
    }
    return { id: known.id, name: known.name, path: known.path };
  });
}

/** 保留原顺序里仍勾选、或不在当前树中的部门；新勾选按树的前序追加。 */
export function mergeDepartmentSelection(
  current: DepartmentChoice[],
  checkedIds: ReadonlySet<string>,
  treeOrder: DepartmentChoice[],
): DepartmentChoice[] {
  const catalog = new Set(treeOrder.map((item) => item.id));
  const kept = current.filter((item) => !catalog.has(item.id) || checkedIds.has(item.id));
  const known = new Set(kept.map((item) => item.id));
  const appended = treeOrder.filter((item) => checkedIds.has(item.id) && !known.has(item.id));
  return [...kept, ...appended];
}

export function sameDepartmentOrder(
  left: Array<{ id: string }>,
  right: Array<{ id: string }>,
): boolean {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id);
}

export function toDepartmentViews(items: DepartmentChoice[]): MemberDepartmentView[] {
  return items.map((item, index) => ({
    id: item.id,
    name: item.name,
    primary: index === 0,
  }));
}
