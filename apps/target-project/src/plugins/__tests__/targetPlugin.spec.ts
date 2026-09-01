// @vitest-environment jsdom

import { defineComponent } from "vue";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getActivePinia } from "pinia";
import {
  bootstrapAdminApp,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  isPageRegistered,
  resetAdminRuntime,
  type InAdminPlugin,
} from "@ingot/admin-core";
import { TARGET_PLUGIN_META, targetPlugin } from "../targetPlugin";
import { useTargetSharedStore } from "@/stores/shared";

const stubBasePlugin: InAdminPlugin = {
  id: "ingot-admin",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages: {
    "ingot.base.dashboard": async () =>
      defineComponent({
        name: "StubDashboard",
        template: "<div />",
      }),
  },
};

describe("targetPlugin 集成", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    resetAdminRuntime();
    document.body.innerHTML = "";
  });

  it("注册 D/E/F 页面键、全局组件与指令，并共享 Pinia", async () => {
    const runtime = await bootstrapAdminApp({
      appCode: "target-project-test",
      branding: { title: "Target Test" },
      login: {
        loginUri: "/login",
        callbackUri: "/callback",
        fingerprintEnabled: false,
      },
      plugins: [stubBasePlugin, targetPlugin],
      mountTarget: "#app",
    });

    for (const key of TARGET_PLUGIN_META.pageKeys) {
      expect(isPageRegistered(key)).toBe(true);
    }
    expect(isPageRegistered("ingot.base.dashboard")).toBe(true);

    expect(runtime.app.component("BizTargetDemoBadge")).toBeTruthy();
    expect(runtime.app.component("InTable")).toBeTruthy();
    expect(runtime.app.directive("demo-highlight")).toBeTruthy();
    expect(runtime.app.directive("auth")).toBeTruthy();

    const shared = useTargetSharedStore(runtime.pinia);
    shared.increment();
    expect(shared.counter).toBe(1);
    expect(getActivePinia()).toBe(runtime.pinia);

    runtime.app.unmount();
  });
});
