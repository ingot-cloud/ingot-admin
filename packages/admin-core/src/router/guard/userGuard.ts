import type { NavigationGuardWithThis } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import { ensureSessionBootstrap, useUserInfoStore } from "@/stores/modules/auth";
import { useGlobalLoading } from "@/hooks/biz/useGlobalLoading";

export class UserInfoGuard extends BaseNavigationGuard {
  public order(): number {
    return 20;
  }

  public exec(): NavigationGuardWithThis<undefined> {
    const globalLoading = useGlobalLoading();
    return async (to) => {
      const { getUserInfoWhetherExist } = storeToRefs(useUserInfoStore());
      const exist = getUserInfoWhetherExist.value;
      if (!to.meta.permitAuth && !exist) {
        return await new Promise<boolean | { path: string; replace: boolean }>((resolve) => {
          globalLoading.start();
          ensureSessionBootstrap()
            .then(() => {
              to.meta.dynamicRoutes = true;
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
        });
      }

      const { getIsInitPwd } = storeToRefs(useUserInfoStore());
      if (getIsInitPwd.value && to.fullPath !== "/init") {
        return {
          path: "/init",
          replace: true,
        };
      }

      return true;
    };
  }
}
