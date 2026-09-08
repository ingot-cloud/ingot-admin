// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { bootstrapAdminApp } from "../bootstrap";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "../plugin";
import { resetAdminRuntime } from "../runtime";
import { ADMIN_THEME_ATTR } from "./applyTheme";
import { defaultAdminTheme } from "./defaultTheme";

const baseOptions = {
  appCode: "test-admin",
  branding: { title: "Test Admin" },
  login: {
    loginUri: "/login",
    callbackUri: "/callback",
    fingerprintEnabled: false,
  },
  plugins: [] as const,
};

describe("bootstrap 主题接入", () => {
  afterEach(() => {
    resetAdminRuntime();
    document.body.innerHTML = "";
  });

  it("未配置主题时回退到默认主题并在挂载前写入根样式", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const runtime = await bootstrapAdminApp({ ...baseOptions, plugins: [] });
    expect(document.documentElement.getAttribute(ADMIN_THEME_ATTR)).toBe(defaultAdminTheme.id);
    runtime.app.unmount();
  });

  it("主题协议不兼容时在挂载前抛出中文错误", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    await expect(
      bootstrapAdminApp({
        ...baseOptions,
        plugins: [
          {
            id: "noop",
            apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
          },
        ],
        theme: {
          id: "acme-legacy",
          apiVersion: 2 as never,
          name: "旧协议",
        },
      }),
    ).rejects.toThrow("主题 “acme-legacy” 的协议版本不兼容");
    expect(document.querySelector("#app")?.hasChildNodes()).toBe(false);
  });
});
