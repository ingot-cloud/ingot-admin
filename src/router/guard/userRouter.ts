import { NavigationGuardWithThis, Router } from "vue-router";
import { NavigationGuard } from "@/types";

export class UserInfoGuard implements NavigationGuard {
  public static get() {
    return new UserInfoGuard();
  }

  public exec(router: Router): NavigationGuardWithThis<undefined> {
    return to => {
      console.log("UserInfoGuard", to.fullPath);

      // 1. 判断用户信息是否存在，若存在则直接进入页面
      // 2. 若不存在则获取用户信息，并且刷新路由信息
    };
  }
}
