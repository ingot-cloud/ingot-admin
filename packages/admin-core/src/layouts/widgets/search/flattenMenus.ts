import type { MenuRouteRecord } from "@/layouts";

/** 顶栏搜索用的菜单叶子：有路径与标题，并保留祖先标题链。 */
export interface FlattenedMenuItem {
  path: string;
  title: string;
  icon?: string;
  ancestors: string[];
}

const isLeaf = (node: MenuRouteRecord): boolean =>
  !node.children || node.children.length === 0;

const walkMenus = (
  nodes: MenuRouteRecord[],
  ancestors: string[],
  result: FlattenedMenuItem[],
): void => {
  for (const node of nodes) {
    const title = node.title?.trim() ?? "";
    if (!isLeaf(node)) {
      walkMenus(node.children ?? [], title ? [...ancestors, title] : ancestors, result);
      continue;
    }
    if (!node.path || !title) {
      continue;
    }
    result.push({
      path: node.path,
      title,
      icon: node.icon,
      ancestors,
    });
  }
};

export const flattenMenus = (menus: MenuRouteRecord[]): FlattenedMenuItem[] => {
  const result: FlattenedMenuItem[] = [];
  walkMenus(menus, [], result);
  return result;
};

export const filterMenusByName = (
  items: FlattenedMenuItem[],
  keyword: string,
): FlattenedMenuItem[] => {
  const query = keyword.trim().toLowerCase();
  if (!query) {
    return [];
  }
  return items.filter((item) => {
    if (item.title.toLowerCase().includes(query)) {
      return true;
    }
    return item.ancestors.some((ancestor) => ancestor.toLowerCase().includes(query));
  });
};
