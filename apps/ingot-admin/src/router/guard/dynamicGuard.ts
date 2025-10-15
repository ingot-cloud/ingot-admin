import type { NavigationGuardWithThis, Router } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import { useRouterStore } from "@/stores/modules/router";

export class DynamicRouterGuard extends BaseNavigationGuard {
  public order(): number {
    return 30;
  }

  public exec(router: Router): NavigationGuardWithThis<undefined> {
    return async (to) => {
      // 如果需要获取动态路由，则发送请求
      if (to.meta.dynamicRoutes) {
        const result = await useRouterStore().fetchRoutes();
        result.dynamicRoutes.forEach((route) => {
          router.addRoute(route);
        });
        return { path: to.fullPath, replace: true, query: to.query };
      }

      return true;
    };
  }
}
