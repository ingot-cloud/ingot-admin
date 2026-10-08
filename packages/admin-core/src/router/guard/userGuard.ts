import type { NavigationGuardWithThis } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import { DomainMismatchError, ensureSessionBootstrap, useUserInfoStore } from "@/stores/modules/auth";
import { useGlobalLoading } from "@/hooks/biz/useGlobalLoading";

export class UserInfoGuard extends BaseNavigationGuard {
  public order(): number {
    return 20;
  }

  public exec(): NavigationGuardWithThis<undefined> {
    const globalLoading = useGlobalLoading();
    return async (to) => {
      const user = useUserInfoStore();
      let loaded = false;
      if (!to.meta.permitAuth && !user.getUserInfoWhetherExist) {
        globalLoading.start();
        try {
          await ensureSessionBootstrap();
          loaded = true;
        } catch (error) {
          globalLoading.stop();
          if (error instanceof DomainMismatchError) {
            return { path: "/auth/identity-error", replace: true };
          }
          return false;
        }
      }
      if (!to.meta.permitAuth && user.getIsInitPwd) {
        // 首次 bootstrap 后也必须检查，不能先进入动态业务路由。
        to.meta.dynamicRoutes = false;
        if (to.path !== "/init") return { path: "/init", replace: true };
      } else if (loaded) {
        to.meta.dynamicRoutes = true;
      }

      return true;
    };
  }
}
