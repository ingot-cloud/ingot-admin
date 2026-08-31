import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";
import { PageName } from "@/router/constants";
import { commonRoutes } from "./common";

describe("dynamic route bootstrap", () => {
  it("matches a refreshed dynamic path before the server routes are registered", () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: commonRoutes,
    });

    const route = router.resolve("/platform/config/app/home");

    expect(route.name).toBe(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
  });

  it("allows the real dynamic route to replace the bootstrap matcher", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: commonRoutes,
    });
    const path = "/platform/config/app/home";

    router.beforeEach((to) => {
      if (to.name !== PageName.DYNAMIC_ROUTE_BOOTSTRAP) {
        return true;
      }
      router.addRoute({
        path,
        name: "PlatformConfigAppHome",
        component: { template: "<div />" },
      });
      router.removeRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
      return to.fullPath;
    });

    await router.push(path);

    expect(router.currentRoute.value.name).toBe("PlatformConfigAppHome");
    expect(router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP)).toBe(false);
  });
});
