import { createRouter, createWebHistory } from "vue-router";
import routes from "@/router/routes";
import { guardManager } from "@/router/guard";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 装载guard
guardManager.install(router);

export default router;
export * from "./constants";
