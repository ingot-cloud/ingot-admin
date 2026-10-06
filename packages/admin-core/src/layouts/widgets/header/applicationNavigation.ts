import type { MenuRouteRecord } from "@/layouts";
import type { IamApplicationSummary } from "@/models/iam";

/** 保留应用的授权菜单及必要祖先，不从未授权应用补充内容。 */
export const applicationMenus = (menus: MenuRouteRecord[], applicationId: string): MenuRouteRecord[] =>
  menus.flatMap((menu) => {
    if (menu.applicationId === applicationId) return [menu];
    const children = applicationMenus(menu.children ?? [], applicationId);
    return children.length ? [{ ...menu, children }] : [];
  });

export const navigableApplicationPath = (menus: MenuRouteRecord[]): string | undefined => {
  for (const menu of menus) {
    if (menu.children?.length) {
      const path = navigableApplicationPath(menu.children);
      if (path) return path;
    } else if (menu.path && menu.path !== "/") return menu.path;
  }
  return undefined;
};

export const navigableApplications = (applications: IamApplicationSummary[], menus: MenuRouteRecord[]): IamApplicationSummary[] =>
  applications.filter((app) => navigableApplicationPath(applicationMenus(menus, app.id)))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));

/** 路由无应用元信息时，按最具体的授权菜单路径同步；详情页可继承父页面。 */
export const applicationForPath = (menus: MenuRouteRecord[], path: string): string | undefined => {
  let selected: { id: string; length: number } | undefined;
  const visit = (nodes: MenuRouteRecord[], inherited?: string): void => {
    for (const menu of nodes) {
      const id = menu.applicationId ?? inherited;
      if (id && menu.path && (path === menu.path || path.startsWith(`${menu.path}/`))
          && (!selected || menu.path.length > selected.length)) selected = { id, length: menu.path.length };
      visit(menu.children ?? [], id);
    }
  };
  visit(menus);
  return selected?.id;
};
