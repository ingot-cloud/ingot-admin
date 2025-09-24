import type { NavigationGuardWithThis } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";
import CancelManager from "@/net/cancel";

export class GlobalGuard extends BaseNavigationGuard {
  public order(): number {
    return 1;
  }

  public exec(): NavigationGuardWithThis<undefined> {
    return () => {
      CancelManager.abort();
      return true;
    };
  }
}
