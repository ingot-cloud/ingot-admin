import { NavigationGuardWithThis } from "vue-router";
import { BaseNavigationGuard } from "@/core/router/types";
import { store } from "@/store";

export class AuthGuard extends BaseNavigationGuard {
  public static get() {
    return new AuthGuard();
  }

  public exec(): NavigationGuardWithThis<undefined> {
    return to => {
      // 1. 判断页面是否需要鉴权，若不需要则直接进入
      // 2. 若需要鉴权，判断 token 是否存在，如果不存在那么重定向到登录页面
      // 3. 若token存在，则走用户信息拦截器
      if (!to.meta.permitAuth) {
        const token = store.getters.accessToken;
        if (!token || token.length === "") {
          // 终止导航重定向到 login
          return { path: "/login", query: { redirect: to.fullPath } };
        }
      } else {
        // 不执行后面所有 NavigationGuard 的逻辑
        to.skipAfterGuard = true;
      }
    };
  }
}
