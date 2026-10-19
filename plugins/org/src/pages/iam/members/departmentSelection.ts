import type { DepartmentTreeNode, MemberDepartmentView } from "@ingot/admin-common";

export interface DepartmentChoice {
  id: string;
  name: string;
  /** 含自身的上级链；根部门为空。 */
  path: string;
}

/** 上级部门单选禁选自身和子树，节点仍可展开。 */
export function departmentSubtreeIds(nodes: DepartmentTreeNode[], targetId?: string): Set<string> {
  const result = new Set<string>();
  if (!targetId) return result;
  const walk = (list: DepartmentTreeNode[], excluded = false): void => {
    for (const node of list) {
      const blocked = excluded || node.id === targetId;
      if (blocked) result.add(node.id);
      walk(node.children || [], blocked);
    }
  };
  walk(nodes);
  return result;
}

export interface DepartmentDisplay extends MemberDepartmentView {
  path: string;
}

export function flattenDepartmentChoices(nodes: DepartmentTreeNode[]): DepartmentChoice[] {
  const byId = new Map<string, DepartmentTreeNode>();
  const collect = (list: DepartmentTreeNode[]): void => {
    for (const node of list) {
      byId.set(node.id, node);
      if (node.children?.length) {
        collect(node.children);
      }
    }
  };
  collect(nodes);

  const pathOf = (node: DepartmentTreeNode): string => {
    if (!node.parentId) {
      return "";
    }
    const names: string[] = [node.name];
    let current = byId.get(node.parentId);
    while (current) {
      names.unshift(current.name);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return names.join("/");
  };

  const items: DepartmentChoice[] = [];
  const walk = (list: DepartmentTreeNode[]): void => {
    for (const node of list) {
      items.push({
        id: node.id,
        name: node.name,
        path: pathOf(node),
      });
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return items;
}

/** 用当前树补齐名称和路径；树外部门只保留名称。 */
export function withCatalogPaths(
  items: DepartmentChoice[],
  catalog: DepartmentChoice[],
): DepartmentChoice[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return items.map((item) => {
    const known = byId.get(item.id);
    if (!known) {
      return { id: item.id, name: item.name, path: "" };
    }
    return { id: known.id, name: known.name, path: known.path };
  });
}

export function withDepartmentDisplays(
  departments: MemberDepartmentView[] | undefined,
  catalog: DepartmentChoice[],
): DepartmentDisplay[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return [...(departments ?? [])]
    .sort((left, right) => Number(right.primary) - Number(left.primary))
    .map((item) => ({
      id: item.id,
      name: byId.get(item.id)?.name ?? item.name,
      primary: item.primary,
      path: byId.get(item.id)?.path ?? "",
    }));
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

export function moveDepartmentChoice(
  items: DepartmentChoice[],
  fromId: string,
  toId: string,
): DepartmentChoice[] {
  if (fromId === toId) {
    return items;
  }
  const next = [...items];
  const fromIndex = next.findIndex((item) => item.id === fromId);
  const toIndex = next.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0) {
    return items;
  }
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return items;
  }
  next.splice(toIndex, 0, moved);
  return next;
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
