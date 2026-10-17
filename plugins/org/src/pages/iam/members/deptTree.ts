import type { DepartmentRecord, DepartmentTreeNode, DepartmentTreeRow, ResourceDetail } from "@ingot/admin-common";
import type { DeptRow } from "./deptTable";

export const ROOT_DEPT_AVATAR_SIZE = 24;
export const CHILD_DEPT_ICON_SIZE = 14;
export const DEPT_TREE_ROW_HEIGHT = 40;
export const DEPT_TREE_INDENT = 16;
export const DEPT_TABLE_ROW_HEIGHT = 56;

export function isRootDepartment(node: { parentId?: string | null }): boolean {
  return node.parentId == null || node.parentId === "";
}

export function departmentNameInitial(name?: string): string {
  const text = name?.trim() ?? "";
  if (!text) {
    return "";
  }
  return [...text][0] ?? "";
}

/** 主部门单独占一行，直属子部门提到与主部门同级，更深层仍挂在各自父节点下。 */
export function toMemberDeptNode(node: DepartmentTreeRow): DepartmentTreeNode {
  return {
    ...node.record,
    children: node.children.length > 0 ? node.children.map(toMemberDeptNode) : undefined,
  };
}

export function toDeptRow(node: DepartmentTreeRow): DeptRow {
  return {
    record: node.record,
    fieldAccess: node.fieldAccess,
    capabilities: node.capabilities,
    version: node.version,
    ...node.record,
    children: node.children.length > 0 ? node.children.map(toDeptRow) : undefined,
  };
}

export function flattenRootDepartmentChildren<T extends { parentId?: string | null; children?: T[] }>(
  tree: T[],
): T[] {
  const roots = tree.filter((node) => isRootDepartment(node));
  if (roots.length !== 1) {
    return tree;
  }
  const [root] = roots;
  const children = root.children ?? [];
  if (children.length === 0) {
    return tree;
  }
  const extras = tree.filter((node) => !isRootDepartment(node));
  return [{ ...root, children: undefined }, ...children, ...extras];
}

/** 部门表按飞书缩进：把接口拍平的一级部门挂回主部门下。 */
export function nestRootDepartmentChildren<T extends { id?: string; parentId?: string | null; children?: T[] }>(
  tree: T[],
): T[] {
  const roots = tree.filter((node) => isRootDepartment(node));
  if (roots.length !== 1) {
    return tree;
  }
  const [root] = roots;
  const firstLevel = tree.filter((node) => node.parentId === root.id);
  if (firstLevel.length === 0) {
    return tree;
  }
  const extras = tree.filter((node) => !isRootDepartment(node) && node.parentId !== root.id);
  return [{ ...root, children: firstLevel }, ...extras];
}

const asNodes = <T extends { children?: T[] }>(nodes?: T[]): T[] => nodes ?? [];

export function buildDeptRows(details: Array<ResourceDetail<DepartmentRecord>>): DeptRow[] {
  const nodes = new Map<string, DeptRow>();
  for (const detail of details) {
    nodes.set(detail.record.id, { ...detail, ...detail.record });
  }
  const roots: DeptRow[] = [];
  const ordered = [...details].sort((left, right) => left.record.sortOrder - right.record.sortOrder);
  for (const detail of ordered) {
    const node = nodes.get(detail.record.id);
    if (!node) {
      continue;
    }
    const parent = detail.record.parentId ? nodes.get(detail.record.parentId) : undefined;
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children = parent.children ?? [];
    parent.children.push(node);
  }
  return roots;
}

export const filterDeptTree = <T extends { id?: string; name?: string; children?: T[] }>(
  nodes: T[],
  keyword: string,
): T[] => {
  const query = keyword.trim().toLowerCase();
  if (!query) {
    return nodes;
  }
  const walk = (list: T[]): T[] => {
    const next: T[] = [];
    for (const node of list) {
      const originChildren = asNodes(node.children);
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

export const collectExpandableDeptIds = <T extends { id?: string; children?: T[] }>(
  nodes: T[],
): string[] => {
  const keys: string[] = [];
  const walk = (list: T[]): void => {
    for (const node of list) {
      const children = asNodes(node.children);
      if (node.id && children.length > 0) {
        keys.push(node.id);
        walk(children);
      }
    }
  };
  walk(nodes);
  return keys;
};
