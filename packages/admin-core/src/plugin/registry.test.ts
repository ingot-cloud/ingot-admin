import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import { AdminPluginRegistry } from "./registry";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "./types";
import type { InAdminPlugin } from "./types";

const component = defineComponent({ name: "TestComponent", template: "<div />" });

const createPlugin = (id: string, values: Partial<InAdminPlugin>): InAdminPlugin => ({
  id,
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  ...values,
});

describe("AdminPluginRegistry", () => {
  it.each([
    {
      first: { pages: { "target.page": async () => component } },
      second: { pages: { "target.page": async () => component } },
      code: "DUPLICATE_PAGE_KEY",
    },
    {
      first: { components: { BizTargetCard: component } },
      second: { components: { BizTargetCard: component } },
      code: "DUPLICATE_COMPONENT_NAME",
    },
    {
      first: { directives: { focus: {} } },
      second: { directives: { focus: {} } },
      code: "DUPLICATE_DIRECTIVE_NAME",
    },
    {
      first: { staticRoutes: [{ path: "/first", name: "shared-route", component }] },
      second: { staticRoutes: [{ path: "/second", name: "shared-route", component }] },
      code: "DUPLICATE_ROUTE_NAME",
    },
  ])("以 $code 阻止资源覆盖", ({ first, second, code }) => {
    const registry = new AdminPluginRegistry();
    registry.collect(createPlugin("first-plugin", first));

    expect(() => registry.collect(createPlugin("second-plugin", second))).toThrowError(
      expect.objectContaining({ code }),
    );
  });

  it("列出页面与布局并带上 kind", () => {
    const registry = new AdminPluginRegistry();
    registry.collect(
      createPlugin("demo-plugin", {
        pages: { "demo.home": async () => component },
        layouts: { "demo.layout.shell": async () => component },
      }),
    );

    expect(registry.listViews()).toEqual([
      { key: "demo.home", kind: "page", pluginId: "demo-plugin" },
      { key: "demo.layout.shell", kind: "layout", pluginId: "demo-plugin" },
    ]);
  });

  it("冻结后只允许读取已注册页面", async () => {
    const registry = new AdminPluginRegistry();
    registry.collect(
      createPlugin("target-plugin", {
        pages: { "target.page": async () => component },
      }),
    );
    registry.freeze();

    await expect(registry.resolvePage("target.page")?.()).resolves.toBe(component);
    expect(() => registry.collect(createPlugin("late-plugin", {}))).toThrow("已冻结");
  });
});
