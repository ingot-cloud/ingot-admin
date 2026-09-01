import type { NavigationGuardWithThis, Router } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import { useRouterStore } from "@/stores/modules/router";
import { PageName } from "@/router/constants";

export class DynamicRouterGuard extends BaseNavigationGuard {
  public order(): number {
    return 30;
  }

  public exec(router: Router): NavigationGuardWithThis<undefined> {
    return async (to) => {
      // 如果需要获取动态路由，则发送请求
      if (to.meta.dynamicRoutes) {
        const result = await useRouterStore().fetchRoutes();
        if (result.dynamicRoutes.length === 0) {
          return false;
        }
        result.dynamicRoutes.forEach((route) => {
          router.addRoute(route);
        });
        if (router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP)) {
          router.removeRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
        }
        return { path: to.fullPath, replace: true, query: to.query };
      }

      return true;
    };
  }
}
