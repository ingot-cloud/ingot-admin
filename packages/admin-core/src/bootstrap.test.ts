// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bootstrapAdminApp } from "./bootstrap";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "./plugin";
import { resetAdminRuntime } from "./runtime";

describe("bootstrapAdminApp", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    resetAdminRuntime();
  });

  it("插件安装失败时不会挂载应用", async () => {
    await expect(
      bootstrapAdminApp({
        appCode: "test-admin",
        branding: { title: "Test Admin" },
        login: {
          loginUri: "/login",
          callbackUri: "/callback",
          fingerprintEnabled: false,
        },
        plugins: [
          {
            id: "failed-plugin",
            apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
            install: () => {
              throw new Error("install failed");
            },
          },
        ],
      }),
    ).rejects.toThrow("install failed");

    expect(document.querySelector("#app")?.hasChildNodes()).toBe(false);
  });
});
