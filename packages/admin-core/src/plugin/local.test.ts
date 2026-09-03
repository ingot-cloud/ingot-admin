import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { defineAppLocalPlugin } from "./local";

const page = defineComponent({ name: "LocalPage", template: "<div />" });
const layout = defineComponent({ name: "LocalLayout", template: "<router-view />" });

describe("defineAppLocalPlugin", () => {
  it("用 appCode 生成页面与布局 prefix", async () => {
    const plugin = defineAppLocalPlugin({
      appCode: "ingot-admin",
      pageModules: {
        "../pages/demo/overview/IndexPage.vue": async () => ({ default: page }),
      },
      pageSourceRoot: "../pages",
      layoutModules: {
        "../layouts/workbench/IndexPage.vue": async () => ({ default: layout }),
      },
      layoutSourceRoot: "../layouts",
    });

    expect(plugin.id).toBe("ingot-admin-local");
    expect(plugin.pages?.["ingot.admin.demo.overview"]).toBeTypeOf("function");
    expect(plugin.layouts?.["ingot.admin.layout.workbench"]).toBeTypeOf("function");
    await expect(plugin.pages?.["ingot.admin.demo.overview"]?.()).resolves.toBe(page);
  });
});
