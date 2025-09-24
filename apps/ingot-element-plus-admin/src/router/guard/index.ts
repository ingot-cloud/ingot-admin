import type { BaseNavigationGuard } from "@/router/types";
import type { Router } from "vue-router";
import { AuthGuard } from "./authGuard";
import { UserInfoGuard } from "./userGuard";
import { DynamicRouterGuard } from "./dynamicGuard";
import { GlobalGuard } from "./globalGuard";
import { EndGuard } from "./endGuard";

class GuardManager {
  private guards: BaseNavigationGuard[] = [];

  public constructor() {
    this.guards.push(new GlobalGuard());
    this.guards.push(new DynamicRouterGuard());
    this.guards.push(new UserInfoGuard());
    this.guards.push(new AuthGuard());
    this.guards.push(new EndGuard());

    this.guards.sort((l, r) => {
      return l.order() - r.order();
    });
  }

  public install(router: Router) {
    // 注册 guard
    this.guards.forEach((guard) => {
      router.beforeEach(guard.proxy(router));
    });
  }
}

export const guardManager = new GuardManager();
