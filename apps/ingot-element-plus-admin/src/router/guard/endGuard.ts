import type { NavigationGuardWithThis } from "vue-router";
import { BaseNavigationGuard } from "@/router/types";

export class EndGuard extends BaseNavigationGuard {
  public order(): number {
    return 999;
  }

  public exec(): NavigationGuardWithThis<undefined> {
    const globalLoading = useGlobalLoading();
    return (to) => {
      if (!to.meta.manualCloseGlobalLoading) {
        globalLoading.stop(1000);
      }
      return true;
    };
  }
}
