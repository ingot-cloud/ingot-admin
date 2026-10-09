import type { MenuRouteRecord } from "@/layouts";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { applicationMenus, navigableApplicationPath } from "./header/applicationNavigation";
export function activeMenuPath(
  route: RouteLocationNormalizedLoaded,
  menus: MenuRouteRecord[],
  previous?: string,
): string | undefined {
  const paths = new Set<string>();
  const visit = (nodes: MenuRouteRecord[]): void => {
    for (const item of nodes) {
      paths.add(item.path);
      visit(item.children ?? []);
    }
  };
  visit(menus);
  if (paths.has(route.path)) return route.path;
  for (const ancestor of [...route.matched].reverse().slice(1))
    if (paths.has(ancestor.path)) return ancestor.path;
  if (previous && paths.has(previous)) return previous;
  return navigableApplicationPath(
    route.meta.applicationId ? applicationMenus(menus, route.meta.applicationId) : menus,
  );
}
