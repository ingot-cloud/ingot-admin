import type { RouteRecordRaw } from "vue-router";
import { LOGIN_PATH } from "@ingot/auth-core";
/** 只注册公开登录路由，不占用管理台根路由和404。 */
export function createAuthRoutes(): RouteRecordRaw[] {
  return [
    {
      path: LOGIN_PATH,
      name: "internal-login",
      component: () => import("./pages/login/IndexPage.vue"),
      meta: { permitAuth: true, hideMenu: true, hideBreadcrumb: true, title: "登录" },
    },
  ];
}
