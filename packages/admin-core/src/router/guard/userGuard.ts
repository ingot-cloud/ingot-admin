import type { NavigationGuardWithThis } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import {
  DomainMismatchError,
  ensureSessionBootstrap,
  useUserInfoStore,
} from "@/stores/modules/auth";
import { useGlobalLoading } from "@/hooks/biz/useGlobalLoading";
import { MenuConfigurationError, navigationErrorLocation } from "@/router/navigationError";
import { useRouterStore } from "@/stores/modules/router";
import { isApiError } from "@ingot/http-client";
import { hasPendingOrganizationSwitch, ORGANIZATION_SWITCH_PATH } from "@ingot/auth-core";
import { getAdminRuntimeConfig } from "@/runtime";

export class UserInfoGuard extends BaseNavigationGuard {
  public order(): number {
    return 20;
  }

  public exec(): NavigationGuardWithThis<undefined> {
    const globalLoading = useGlobalLoading();
    return async (to) => {
      if (to.meta.sessionOnly) {
        to.meta.dynamicRoutes = false;
        try {
          const { confirmBrowserSession } = await import("@/auth/browserContext");
          await confirmBrowserSession();
          return true;
        } catch (error) {
          if (isApiError(error) && error.status === 401)
            return { path: "/login/", query: { loggedOut: "1" }, replace: true };
          // 认证依赖故障由选择页展示重试；候选仍必须通过服务端严格认证后才返回。
          if (isApiError(error) && error.status === 503) return true;
          return { path: "/auth/identity-error", replace: true };
        }
      }
      const user = useUserInfoStore();
      if (!to.meta.permitAuth && useRouterStore().configurationError) {
        return navigationErrorLocation(to.fullPath);
      }
      let loaded = false;
      if (!to.meta.permitAuth && !user.getUserInfoWhetherExist) {
        globalLoading.start();
        try {
          await ensureSessionBootstrap();
          loaded = true;
        } catch (error) {
          globalLoading.stop();
          if (
            isApiError(error) &&
            error.code === "IdentityInvalid" &&
            getAdminRuntimeConfig().login.entry === "tenant"
          )
            return { path: ORGANIZATION_SWITCH_PATH, replace: true };
          if (isApiError(error) && error.status === 401)
            return { path: "/login/", query: { loggedOut: "1" }, replace: true };
          if (isApiError(error) && error.cancelled && hasPendingOrganizationSwitch())
            return { path: ORGANIZATION_SWITCH_PATH, replace: true };
          if (error instanceof DomainMismatchError) {
            return { path: "/auth/identity-error", replace: true };
          }
          if (error instanceof MenuConfigurationError) return navigationErrorLocation(to.fullPath);
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
