// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getActivePinia } from "pinia";
import { bootstrapAdminApp } from "./bootstrap";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "./plugin";
import { PageName } from "./router";
import { resetAdminRuntime } from "./runtime";
import type { InAdminPlugin } from "./plugin";

describe("bootstrap 集成", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    resetAdminRuntime();
    document.body.innerHTML = "";
  });

  it("注册静态路由、公共组件，并共享同一个 Pinia 实例", async () => {
    let pluginPinia: ReturnType<typeof getActivePinia>;
    const observerPlugin: InAdminPlugin = {
      id: "observer-plugin",
      apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
      install: ({ pinia }) => {
        pluginPinia = pinia;
      },
    };

    const runtime = await bootstrapAdminApp({
      appCode: "test-admin",
      branding: { title: "Test Admin" },
      login: {
        loginUri: "/login",
        callbackUri: "/callback",
        fingerprintEnabled: false,
      },
      plugins: [observerPlugin],
    });

    expect(runtime.router.hasRoute(PageName.REDIRECT)).toBe(true);
    expect(runtime.router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP)).toBe(true);
    expect(runtime.app.component("InTable")).toBeTruthy();
    expect(runtime.app.component("InContainer")).toBeTruthy();
    expect(runtime.app.component("InRefreshIcon")).toBeTruthy();
    expect(runtime.app.component("InBizTabsHeader")).toBeTruthy();
    expect(runtime.app.directive("auth")).toBeTruthy();
    expect(runtime.pinia).toBe(getActivePinia());
    expect(pluginPinia).toBe(runtime.pinia);

    runtime.app.unmount();
  });
});
