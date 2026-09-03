import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { definePluginPages, toDefaultMenuPath, toViewPrefix } from "./pages";
import type { PluginPageGlobModules } from "./pages";

const sessionsPage = defineComponent({ name: "SessionsPage", template: "<div />" });
const sessionPanel = defineComponent({ name: "SessionListPanel", template: "<div />" });
const homePage = defineComponent({ name: "HomePage", template: "<div />" });
const accessPage = defineComponent({ name: "AccessProtectionPage", template: "<div />" });

const sessionsLoader = async () => ({ default: sessionsPage });
const panelLoader = async () => ({ default: sessionPanel });
const homeLoader = async () => ({ default: homePage });
const accessLoader = async () => ({ default: accessPage });

describe("definePluginPages", () => {
  it("只为 IndexPage 生成 canonical 键", async () => {
    const modules: PluginPageGlobModules = {
      "./pages/sessions/IndexPage.vue": sessionsLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "security",
    });

    expect(Object.keys(pages)).toEqual(["security.sessions"]);
    await expect(pages["security.sessions"]()).resolves.toBe(sessionsPage);
  });

  it("不注册非 IndexPage", () => {
    const modules: PluginPageGlobModules = {
      "./pages/sessions/IndexPage.vue": sessionsLoader,
      "./pages/sessions/components/SessionListPanel.vue": panelLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "security",
    });

    expect(pages["security.sessions"]).toBeTypeOf("function");
    expect(Object.keys(pages)).toEqual(["security.sessions"]);
  });

  it("把路径分隔符和连字符转成 semantic 点分键", () => {
    const modules: PluginPageGlobModules = {
      "./pages/access-protection/IndexPage.vue": accessLoader,
      "./pages/config/app/home/IndexPage.vue": homeLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "platform",
    });

    expect(pages["platform.access.protection"]).toBeTypeOf("function");
    expect(pages["platform.config.app.home"]).toBeTypeOf("function");
  });

  it("把 plugin-unavailable 编成 common.plugin.unavailable", () => {
    const pages = definePluginPages({
      modules: {
        "./pages/common/plugin-unavailable/IndexPage.vue": accessLoader,
      },
      sourceRoot: "./pages/common",
      canonicalPrefix: "common",
    });

    expect(Object.keys(pages)).toEqual(["common.plugin.unavailable"]);
  });

  it("布局 IndexPage 编成 layout.{slot}，忽略 widgets", () => {
    const pages = definePluginPages({
      modules: {
        "./layouts/main/IndexPage.vue": homeLoader,
        "./layouts/simple/IndexPage.vue": sessionsLoader,
        "./layouts/widgets/InAppBar.vue": panelLoader,
      },
      sourceRoot: "./layouts",
      canonicalPrefix: "layout",
    });

    expect(Object.keys(pages).sort()).toEqual(["layout.main", "layout.simple"]);
  });

  it("绝对路径 glob 键仍能抽出 sourceRoot 之后的相对路径", () => {
    const pages = definePluginPages({
      modules: {
        "/repo/packages/admin-core/src/layouts/iframe/IndexPage.vue?vue": homeLoader,
      },
      sourceRoot: "./layouts",
      canonicalPrefix: "layout",
    });

    expect(Object.keys(pages)).toEqual(["layout.iframe"]);
  });

  it("根目录 IndexPage 的 semantic 后缀回退为 home", () => {
    const modules: PluginPageGlobModules = {
      "./pages/IndexPage.vue": homeLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "demo",
    });

    expect(Object.keys(pages)).toEqual(["demo.home"]);
  });
});

describe("toViewPrefix / toDefaultMenuPath", () => {
  it("把 kebab appCode 转成点分 prefix", () => {
    expect(toViewPrefix("ingot-admin")).toBe("ingot.admin");
    expect(toViewPrefix("acme-console")).toBe("acme.console");
  });

  it("由视图键生成默认可编辑 path", () => {
    expect(toDefaultMenuPath("security.sessions")).toBe("/security/sessions");
    expect(toDefaultMenuPath("layout.main")).toBe("/layout/main");
  });
});
