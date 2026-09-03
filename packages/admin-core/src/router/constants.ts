import type { AsyncComponentLoader, PageKey, RegisteredView } from "@/plugin";

export const NotFound = {
  path: "/:pathMatch(.*)",
  meta: { hideMenu: true, hideBreadcrumb: true },
  redirect: "/404",
};

export const PLUGIN_UNAVAILABLE_PAGE_KEY = "common.plugin.unavailable";

export enum PageLayoutViewPath {
  MAIN = "layout.main",
  SIMPLE = "layout.simple",
  IFRAME = "layout.iframe",
  EXTERNAL = "layout.external",
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
  TYPE = "redirectType",
  PATH = "redirectPath",
}

export const LAYOUT_MAIN = () => import("@/layouts/main/IndexPage.vue");
export const LAYOUT_SIMPLE = () => import("@/layouts/simple/IndexPage.vue");
export const LAYOUT_IFRAME = () => import("@/layouts/iframe/IndexPage.vue");
export const LAYOUT_EXTERNAL = () => import("@/layouts/external/IndexPage.vue");

let appCode = "unknown-admin";
let resolvePage: ((pageKey: PageKey) => AsyncComponentLoader | undefined) | undefined;
let listViews: (() => RegisteredView[]) | undefined;

export const configurePageResolver = (
  currentAppCode: string,
  resolver: (pageKey: PageKey) => AsyncComponentLoader | undefined,
  views?: () => RegisteredView[],
): void => {
  appCode = currentAppCode;
  resolvePage = resolver;
  listViews = views;
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
  const unavailable = resolvePage?.(PLUGIN_UNAVAILABLE_PAGE_KEY);
  if (!unavailable) {
    throw new Error(`应用 ${appCode} 缺少插件页面不可用组件`);
  }
  return unavailable;
};

export const isPageRegistered = (viewPath: string): boolean => Boolean(resolvePage?.(viewPath));

export const getConfiguredAppCode = (): string => appCode;

const HIDDEN_VIEW_PREFIX = "common.";

export const listRegisteredViews = (): RegisteredView[] => {
  return (listViews?.() ?? []).filter((view) => !view.key.startsWith(HIDDEN_VIEW_PREFIX));
};
