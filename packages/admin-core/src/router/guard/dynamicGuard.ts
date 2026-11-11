import type { NavigationGuardWithThis, Router } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import { useRouterStore } from "@/stores/modules/router";
import { PageName } from "@/router/constants";
import { MenuConfigurationError, navigationErrorLocation } from "@/router/navigationError";

export class DynamicRouterGuard extends BaseNavigationGuard {
  public order(): number {
    return 30;
  }

  public exec(router: Router): NavigationGuardWithThis<undefined> {
    return async (to) => {
      // 如果需要获取动态路由，则发送请求
      if (to.meta.dynamicRoutes) {
        let result: Awaited<ReturnType<ReturnType<typeof useRouterStore>["fetchRoutes"]>>;
        try {
          result = await useRouterStore().fetchRoutes();
        } catch (error: unknown) {
          if (error instanceof MenuConfigurationError) return navigationErrorLocation(to.fullPath);
          throw error;
        }
        if (result.dynamicRoutes.length === 0) {
          // 身份守卫已完成bootstrap；无业务菜单的有效成员也能阅读已注册的帮助路由。
          return to.matched.some((record) => record.meta.helpReader === true);
        }
        useRouterStore().installDynamicRoutes(router);
        if (router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP)) {
          router.removeRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
        }
        return { path: to.path, replace: true, query: to.query, hash: to.hash };
      }

      return true;
    };
  }
}
