import type { RouteRecordRaw } from "vue-router";
import type { MenuRouteRecord } from "@/layouts";
import type { MenuTreeNode } from "@/models";
import { MenuType, MenuLinkType } from "@/models/enums";
import { importComponent, NotFound, PagePath } from "@/router/constants";

/**
 * 生成侧栏菜单
 * @param routes 路由表
 */
export const generateMenus = (routes: Array<RouteRecordRaw>): Array<MenuRouteRecord> => {
  return routes
    .filter((item) => {
      return !item.meta?.hideMenu;
    })
    .map((item) => {
      const menu: MenuRouteRecord = {
        path: item.path,
        title: item.meta?.title,
        icon: item.meta?.icon,
      };
      if (item.children) {
        menu.children = generateMenus(item.children);
      }
      return menu;
    });
};

export const cacheRoutes: Array<string> = [];

/**
 * 菜单转换为路由信息
 * @param menus 菜单
 */
export const transformMenu = (menus: Array<MenuTreeNode>): Array<RouteRecordRaw> => {
  const result: Array<RouteRecordRaw> = [];
  menus
    .filter((item) => {
      return item.menuType !== MenuType.Button;
    })
    .forEach((menu) => {
      const route: RouteRecordRaw = menuToRoute(menu);
      if (menu.children?.length) {
        transformMenuItem(route, menu);
      }
      if (menu.isCache && menu.routeName) {
        cacheRoutes.push(menu.routeName);
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
  // 如果菜单不存在，那么代表没有权限，重定向到403
  if (!menus || menus.length == 0) {
    return "/403";
  }
  const menu = menus[0];
  switch (menu.menuType) {
    case MenuType.Button:
      // eslint-disable-next-line no-case-declarations
      const temp = menus.slice();
      temp.shift();
      return findEntryPath(temp);
    case MenuType.Directory:
      if (menu.children && menu.children.length > 0) {
        return findEntryPath(menu.children);
      }
      break;
    case MenuType.Menu:
      return menu.path as string;
  }
  return "/";
};

const transformMenuItem = (route: RouteRecordRaw, menu: MenuTreeNode) => {
  menu.children
    ?.filter((item) => {
      return item.menuType !== MenuType.Button;
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
  const meta: any = {
    title: menu.name,
    icon: menu.icon,
    hideMenu: menu.hidden,
    hideBreadcrumb: menu.hideBreadcrumb,
  };
  if (menu.linkType !== MenuLinkType.Default) {
    meta.linkURL = menu.linkUrl;
  }

  return {
    path: menu.path as string,
    name: menu.routeName,
    redirect: menu.redirect,
    meta,
    component: importComponent(menu.viewPath as string),
    props: menu.props,
    children: [],
  };
};
