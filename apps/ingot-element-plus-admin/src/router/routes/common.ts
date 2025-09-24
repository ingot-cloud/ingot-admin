import type { RouteRecordRaw } from "vue-router";
import { LAYOUT_MAIN, PageName, RedirectPageField } from "@/router/constants";

/**
 * 公共路由
 */
export const commonRoutes: Array<RouteRecordRaw> = [
  {
    path: "/redirect",
    component: LAYOUT_MAIN,
    meta: {
      title: PageName.REDIRECT,
      hideMenu: true,
      hideBreadcrumb: true,
    },
    children: [
      {
        props: true,
        path: `/redirect/:${RedirectPageField.PATH}(.*):${RedirectPageField.TYPE}(.*)`,
        name: PageName.REDIRECT,
        component: () => import("@/pages/common/redirect/IndexPage.vue"),
        meta: {
          title: PageName.REDIRECT,
          hideMenu: true,
          hideBreadcrumb: true,
        },
      },
    ],
  },
  {
    path: "/500",
    meta: { hideMenu: true, hideBreadcrumb: true, permitAuth: true },
    component: () => import("@/pages/common/errors/500Page.vue"),
  },
  {
    path: "/403",
    meta: { hideMenu: true, hideBreadcrumb: true, permitAuth: true },
    component: () => import("@/pages/common/errors/403Page.vue"),
  },
  {
    path: "/404",
    meta: { hideMenu: true, hideBreadcrumb: true, permitAuth: true },
    component: () => import("@/pages/common/errors/404Page.vue"),
  },
];
