import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import type { Directive } from "vue";
import { defineAppLocalPlugin } from "./local";

const page = defineComponent({ name: "LocalPage", template: "<div />" });
const layout = defineComponent({ name: "LocalLayout", template: "<router-view />" });
const badge = defineComponent({ name: "BizTargetDemoBadge", template: "<span />" });
const highlight: Directive = { mounted() { return undefined; } };

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

  it("从约定目录 glob 注册组件与指令", () => {
    const plugin = defineAppLocalPlugin({
      appCode: "ingot-admin",
      componentModules: {
        "./components/BizTargetDemoBadge.vue": { default: badge },
      },
      directiveModules: {
        "./directives/demoHighlight.ts": { default: highlight },
      },
    });

    expect(plugin.components?.BizTargetDemoBadge).toBe(badge);
    expect(plugin.directives?.["demo-highlight"]).toBe(highlight);
  });
});
