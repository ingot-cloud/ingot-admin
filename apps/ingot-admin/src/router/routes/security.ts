import type { RouteRecordRaw } from "vue-router";

/**
 * 安全路由
 */
export const securityRoutes: Array<RouteRecordRaw> = [
  {
    path: "/sso_callback",
    meta: {
      title: "登录",
      permitAuth: true,
      hideMenu: true,
      hideBreadcrumb: true,
      manualCloseGlobalLoading: true,
    },
    component: () => import("@/pages/security/sso-callback/IndexPage.vue"),
  },
  {
    path: "/init",
    meta: {
      permitAuth: true,
      hideMenu: true,
      hideBreadcrumb: true,
      manualCloseGlobalLoading: true,
    },
    component: () => import("@/pages/security/init/IndexPage.vue"),
  },
];
