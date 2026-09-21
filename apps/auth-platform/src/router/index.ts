import { createRouter, createWebHistory } from "vue-router";
import { createAuthRoutes } from "@ingot/auth-plugin";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: createAuthRoutes(),
});

export default router;
