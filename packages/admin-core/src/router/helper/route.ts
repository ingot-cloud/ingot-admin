import type { RouteRecordRaw } from "vue-router";
import type { MenuRouteRecord } from "@/layouts";
import type { MenuTreeNode } from "@/models";
import { MenuType, MenuLinkType, LEGACY_MENU_TYPE_BUTTON } from "@/models/enums";
import {
  getConfiguredAppCode,
  importComponent,
  isPageRegistered,
  NotFound,
  PageLayoutViewPath,
  PagePath,
} from "@/router/constants";

/**
 * 生成侧栏菜单
 * @param routes 路由表
 */
export const generateMenus = (routes: Array<RouteRecordRaw>): Array<MenuRouteRecord> => {
  return routes.flatMap((item) => {
    if (item.meta?.hideMenu || /:[A-Za-z_]/.test(item.path ?? "")) return [];
    const children = item.children ? generateMenus(item.children) : undefined;
    if (item.meta?.menuKind === "DIRECTORY" && !children?.length) return [];
    return [
      {
        path: item.path,
        applicationId: item.meta?.applicationId,
        title: item.meta?.title,
        icon: item.meta?.icon,
        ...(children ? { children } : {}),
      },
    ];
  });
};

export const cacheRoutes: Array<string> = [];

/**
 * 菜单转换为路由信息
 * @param menus 菜单
 */
export const transformMenu = (menus: Array<MenuTreeNode>): Array<RouteRecordRaw> => {
  cacheRoutes.length = 0;
  const result: Array<RouteRecordRaw> = [];
  menus
    .filter((item) => {
      return item.menuType !== LEGACY_MENU_TYPE_BUTTON;
    })
    .forEach((menu) => {
      const route: RouteRecordRaw = menuToRoute(menu);
      if (menu.children?.length) {
        transformMenuItem(route, menu);
      }
      result.push(route);
    });

  // 设置跟重定向
  result.push({
    path: PagePath.ROOT,
    redirect: findEntryPath(menus),
    meta: { hideMenu: true, hideBreadcrumb: true },
  });
  // 最后加入404视图
  result.push(NotFound);
  return result;
};

/**
 * 查询入口路径
 */
const findEntryPath = (menus: Array<MenuTreeNode>): string => {
  for (const menu of menus) {
    if (menu.hidden || menu.menuType === LEGACY_MENU_TYPE_BUTTON) continue;
    if (menu.menuType === MenuType.Menu && menu.path && !/:[A-Za-z_]/.test(menu.path))
      return menu.path;
    const child = findEntryPath(menu.children ?? []);
    if (child !== "/403") return child;
  }
  return "/403";
};

const transformMenuItem = (route: RouteRecordRaw, menu: MenuTreeNode) => {
  menu.children
    ?.filter((item) => {
      return item.menuType !== LEGACY_MENU_TYPE_BUTTON;
    })
    .forEach((item) => {
      const child = menuToRoute(item);
      if (item.children?.length) {
        transformMenuItem(child, item);
      }
      route.children?.push(child);
    });
};

const menuToRoute = (menu: MenuTreeNode) => {
  const meta: RouteRecordRaw["meta"] = {
    title: menu.name,
    applicationId: menu.appId,
    icon: menu.icon,
    hideMenu: menu.hidden,
    hideBreadcrumb: menu.hideBreadcrumb,
    menuId: menu.id,
    menuKind: menu.menuType === MenuType.Directory ? "DIRECTORY" : "PAGE",
    isCache: menu.menuType !== MenuType.Directory && Boolean(menu.isCache),
  };
  if (menu.linkType !== MenuLinkType.Default) {
    meta.linkURL = menu.linkUrl;
  }

  const routeName = menu.routeName || (menu.id ? `iam-menu-${menu.id}` : undefined);
  if (menu.isCache && menu.menuType !== MenuType.Directory && routeName)
    cacheRoutes.push(routeName);
  const viewPath =
    menu.viewPath || (menu.menuType === MenuType.Directory ? PageLayoutViewPath.SIMPLE : undefined);
  const pageRegistered = viewPath ? isPageRegistered(viewPath) : false;
  return {
    path: (menu.path || (menu.id ? `/__iam/menu-${menu.id}` : "")) as string,
    name: routeName,
    redirect: menu.redirect,
    meta,
    component: importComponent(viewPath ?? ""),
    props: pageRegistered
      ? menu.props
      : {
          appCode: getConfiguredAppCode(),
          viewPath: viewPath ?? "",
        },
    children: [],
  };
};
