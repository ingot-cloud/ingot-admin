import type { Option } from "@/models";
import type { AsyncComponentLoader, PageKey } from "@/plugin";

export const NotFound = {
  path: "/:pathMatch(.*)",
  meta: { hideMenu: true, hideBreadcrumb: true },
  redirect: "/404",
};
export enum PageLayoutViewPath {
  CUSTOM = "custom",
  MAIN = "@/layouts/InAppLayout.vue",
  SIMPLE = "@/layouts/InSimpleLayout.vue",
  IFRAME = "@/layouts/InIFrameLayout.vue",
  EXTERNAL = "@/layouts/InExtLinkLayout.vue",
}
export enum PageName {
  DYNAMIC_ROUTE_BOOTSTRAP = "DynamicRouteBootstrap",
  REDIRECT = "Redirect",
}
export enum PagePath {
  ROOT = "/",
}
export enum RedirectPageType {
  NAME = "name",
  PATH = "path",
}
export enum RedirectPageField {
  // 重定向类型
  TYPE = "redirectType",
  PATH = "redirectPath",
}

/**
 * 布局视图
 */
export const LAYOUT_MAIN = () => import("@/layouts/InAppLayout.vue");
export const LAYOUT_SIMPLE = () => import("@/layouts/InSimpleLayout.vue");
export const LAYOUT_IFRAME = () => import("@/layouts/InIFrameLayout.vue");
export const LAYOUT_EXTERNAL = () => import("@/layouts/InExtLinkLayout.vue");
export const LayoutOptions: Array<Option> = [
  {
    label: "自定义",
    value: PageLayoutViewPath.CUSTOM,
  },
  {
    label: "标准视图布局",
    value: PageLayoutViewPath.MAIN,
  },
  {
    label: "路由视图布局",
    value: PageLayoutViewPath.SIMPLE,
  },
  {
    label: "内嵌链接",
    value: PageLayoutViewPath.IFRAME,
  },
  {
    label: "外部链接",
    value: PageLayoutViewPath.EXTERNAL,
  },
];

let appCode = "unknown-admin";
let resolvePage: ((pageKey: PageKey) => AsyncComponentLoader | undefined) | undefined;

export const configurePageResolver = (
  currentAppCode: string,
  resolver: (pageKey: PageKey) => AsyncComponentLoader | undefined,
): void => {
  appCode = currentAppCode;
  resolvePage = resolver;
};

export const importComponent = (viewPath: string): AsyncComponentLoader => {
  const pageKey = viewPath?.trim();
  const component = pageKey ? resolvePage?.(pageKey) : undefined;
  if (component) {
    return component;
  }

  console.error("[InAdmin] 后端菜单引用了当前应用未注册的页面", {
    appCode,
    viewPath: pageKey || undefined,
  });
  const unavailable = resolvePage?.("ingot.common.plugin-unavailable");
  if (!unavailable) {
    throw new Error(`应用 ${appCode} 缺少插件页面不可用组件`);
  }
  return unavailable;
};

export const isPageRegistered = (viewPath: string): boolean => Boolean(resolvePage?.(viewPath));

export const getConfiguredAppCode = (): string => appCode;
