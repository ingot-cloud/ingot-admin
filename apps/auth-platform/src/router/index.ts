import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/oauth2/challenge",
    },
    {
      path: "/oauth2/challenge",
      component: () => import("@/pages/oauth2/challenge/IndexPage.vue"),
    },
    {
      path: "/errors",
      component: () => import("@/pages/errors/IndexPage.vue"),
    },
  ],
});

export default router;
