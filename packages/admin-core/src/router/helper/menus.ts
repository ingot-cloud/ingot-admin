import type { MenuTreeNode } from "@/models";

/** 与后端菜单节点同构，供 `transformMenu` / 侧栏合并使用 */
export type InStaticMenuNode = MenuTreeNode;

const walkMenus = (
  menus: InStaticMenuNode[],
  source: string,
  seenPaths: Map<string, string>,
  seenNames: Map<string, string>,
): void => {
  menus.forEach((node) => {
    if (node.path) {
      const existing = seenPaths.get(node.path);
      if (existing) {
        throw new Error(`菜单 path “${node.path}” 冲突（${existing} 与 ${source}）`);
      }
      seenPaths.set(node.path, source);
    }
    if (node.routeName) {
      const existing = seenNames.get(node.routeName);
      if (existing) {
        throw new Error(`菜单 routeName “${node.routeName}” 冲突（${existing} 与 ${source}）`);
      }
      seenNames.set(node.routeName, source);
    }
    if (node.children?.length) {
      walkMenus(node.children, source, seenPaths, seenNames);
    }
  });
};

/**
 * 合并静态菜单树与动态菜单树。
 *
 * - 静态在前，动态在后（同级顺序，不做按 id 深合并）
 * - 任一节点 `path` 或 `routeName` 冲突则抛错
 *
 * @param staticMenus App / 插件声明的静态菜单
 * @param dynamicMenus 后端 `UserMenuAPI` 返回的动态菜单
 */
export const mergeMenuTrees = (
  staticMenus: InStaticMenuNode[],
  dynamicMenus: InStaticMenuNode[],
): InStaticMenuNode[] => {
  const seenPaths = new Map<string, string>();
  const seenNames = new Map<string, string>();
  walkMenus(staticMenus, "static", seenPaths, seenNames);
  walkMenus(dynamicMenus, "dynamic", seenPaths, seenNames);
  return [...staticMenus, ...dynamicMenus];
};

/**
 * 声明静态菜单的小助手（原样返回，提供类型提示）。
 *
 * @example
 * ```ts
 * staticMenus: defineStaticMenus([
 *   {
 *     name: "示例",
 *     path: "/demo",
 *     routeName: "DemoHome",
 *     menuType: MenuType.Menu,
 *     viewPath: "acme.demo.overview",
 *   },
 * ])
 * ```
 */
export const defineStaticMenus = (menus: InStaticMenuNode[]): InStaticMenuNode[] => menus;
