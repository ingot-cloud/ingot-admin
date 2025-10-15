import type { Option } from "@/models";

export const NotFound = {
  path: "/:pathMatch(.*)",
  meta: { hideMenu: true, hideBreadcrumb: true },
  redirect: "/404",
};
export enum PageLayoutViewPath {
  MAIN = "@/layouts/InAppLayout.vue",
  SIMPLE = "@/layouts/InSimpleLayout.vue",
  IFRAME = "@/layouts/InIFrameLayout.vue",
  EXTERNAL = "@/layouts/InExtLinkLayout.vue",
}
export enum PageName {
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
export const LAYOUT_MAIN = () => import(PageLayoutViewPath.MAIN);
export const LAYOUT_SIMPLE = () => import(PageLayoutViewPath.SIMPLE);
export const LAYOUT_IFRAME = () => import(PageLayoutViewPath.IFRAME);
export const LAYOUT_EXTERNAL = () => import(PageLayoutViewPath.EXTERNAL);
export const LayoutOptions: Array<Option> = [
  {
    label: "标准视图",
    value: PageLayoutViewPath.MAIN,
  },
  {
    label: "路由视图",
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

const dynamicViewsModules = import.meta.glob("@/pages/**/*.vue");
Object.keys(dynamicViewsModules).forEach((key) => {
  dynamicViewsModules[`@${key.substring("/src".length)}`] = dynamicViewsModules[key];
  delete dynamicViewsModules[key];
});
dynamicViewsModules[PageLayoutViewPath.MAIN] = LAYOUT_MAIN;
dynamicViewsModules[PageLayoutViewPath.SIMPLE] = LAYOUT_SIMPLE;
dynamicViewsModules[PageLayoutViewPath.IFRAME] = LAYOUT_IFRAME;
dynamicViewsModules[PageLayoutViewPath.EXTERNAL] = LAYOUT_EXTERNAL;

export const importComponent = (viewPath: string) => {
  return dynamicViewsModules[viewPath];
};
