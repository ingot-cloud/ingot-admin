import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import type { Directive } from "vue";
import {
  definePluginComponents,
  definePluginDirectives,
  toFileStem,
  toKebabCaseName,
} from "./assets";
import { InAdminPluginError } from "./error";

const badge = defineComponent({ name: "BizTargetDemoBadge", template: "<span />" });
const highlight: Directive = {
  mounted() {
    return undefined;
  },
};

describe("toFileStem / toKebabCaseName", () => {
  it("从 glob 路径取文件名", () => {
    expect(toFileStem("./components/biz/BizTargetDemoBadge.vue")).toBe("BizTargetDemoBadge");
    expect(toFileStem("../directives/demoHighlight.ts?raw")).toBe("demoHighlight");
  });

  it("把 camelCase 转成 kebab-case", () => {
    expect(toKebabCaseName("demoHighlight")).toBe("demo-highlight");
  });
});

describe("definePluginComponents", () => {
  it("用文件名注册 Biz* 组件", () => {
    const components = definePluginComponents({
      "./components/BizTargetDemoBadge.vue": { default: badge },
    });
    expect(components.BizTargetDemoBadge).toBe(badge);
  });

  it("拒绝 In* / El* 与非 Biz* 文件名", () => {
    expect(() =>
      definePluginComponents({
        "./components/InButton.vue": { default: badge },
      }),
    ).toThrow(InAdminPluginError);

    expect(() =>
      definePluginComponents({
        "./components/AppHeader.vue": { default: badge },
      }),
    ).toThrow(/Biz/);
  });

  it("拒绝同名组件", () => {
    expect(() =>
      definePluginComponents({
        "./components/a/BizCard.vue": { default: badge },
        "./components/b/BizCard.vue": { default: badge },
      }),
    ).toThrow(/重复/);
  });
});

describe("definePluginDirectives", () => {
  it("用文件名 kebab-case 注册 default 导出", () => {
    const directives = definePluginDirectives({
      "./directives/demoHighlight.ts": { default: highlight },
    });
    expect(directives["demo-highlight"]).toBe(highlight);
  });

  it("缺少 default 导出时失败", () => {
    expect(() =>
      definePluginDirectives({
        "./directives/demoHighlight.ts": {},
      }),
    ).toThrow(InAdminPluginError);
  });
});
