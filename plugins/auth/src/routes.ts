import type { RouteRecordRaw } from "vue-router";

export function createAuthRoutes(): RouteRecordRaw[] {
  return [
    {
      path: "/",
      redirect: "/oauth2/challenge",
    },
    {
      path: "/oauth2/challenge",
      component: () => import("./pages/challenge/IndexPage.vue"),
    },
    {
      path: "/errors",
      component: () => import("./pages/errors/IndexPage.vue"),
    },
  ];
}
