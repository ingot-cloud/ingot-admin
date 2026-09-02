import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { definePluginPages } from "./pages";
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
  it("为 IndexPage 生成 canonical 与两类 legacy semantic key，并共用同一 loader", async () => {
    const modules: PluginPageGlobModules = {
      "./pages/sessions/IndexPage.vue": sessionsLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "ingot.security",
      legacySemanticPrefix: "platform.security",
      legacyFilePrefix: "@/pages/platform/security",
    });

    expect(pages["ingot.security.sessions"]).toBeTypeOf("function");
    expect(pages["ingot.admin.platform.security.sessions"]).toBe(
      pages["ingot.security.sessions"],
    );
    expect(pages["ingot.base.platform.security.sessions"]).toBe(pages["ingot.security.sessions"]);
    expect(pages["@/pages/platform/security/sessions/IndexPage.vue"]).toBe(
      pages["ingot.security.sessions"],
    );

    await expect(pages["ingot.security.sessions"]()).resolves.toBe(sessionsPage);
    await expect(pages["ingot.admin.platform.security.sessions"]()).resolves.toBe(sessionsPage);
    await expect(
      pages["@/pages/platform/security/sessions/IndexPage.vue"](),
    ).resolves.toBe(sessionsPage);
  });

  it("非 IndexPage 只注册 legacy 文件路径 key", () => {
    const modules: PluginPageGlobModules = {
      "./pages/sessions/IndexPage.vue": sessionsLoader,
      "./pages/sessions/components/SessionListPanel.vue": panelLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "ingot.security",
      legacySemanticPrefix: "platform.security",
      legacyFilePrefix: "@/pages/platform/security",
    });

    expect(pages["ingot.security.sessions.components.session.list.panel"]).toBeUndefined();
    expect(pages["@/pages/platform/security/sessions/components/SessionListPanel.vue"]).toBeTypeOf(
      "function",
    );
    expect(Object.keys(pages).filter((key) => key.includes("SessionListPanel"))).toEqual([
      "@/pages/platform/security/sessions/components/SessionListPanel.vue",
    ]);
  });

  it("把路径分隔符和连字符转成 semantic 点分键", () => {
    const modules: PluginPageGlobModules = {
      "./pages/access-protection/IndexPage.vue": accessLoader,
      "./pages/config/app/home/IndexPage.vue": homeLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "ingot.platform",
      legacySemanticPrefix: "platform",
      legacyFilePrefix: "@/pages/platform",
    });

    expect(pages["ingot.platform.access.protection"]).toBeTypeOf("function");
    expect(pages["ingot.admin.platform.access.protection"]).toBe(
      pages["ingot.platform.access.protection"],
    );
    expect(pages["ingot.platform.config.app.home"]).toBeTypeOf("function");
    expect(pages["ingot.base.platform.config.app.home"]).toBe(pages["ingot.platform.config.app.home"]);
  });

  it("根目录 IndexPage 的 semantic 后缀回退为 home", () => {
    const modules: PluginPageGlobModules = {
      "./pages/IndexPage.vue": homeLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "ingot.admin",
      legacySemanticPrefix: "",
      legacyFilePrefix: "@/pages",
    });

    expect(pages["ingot.admin.home"]).toBeTypeOf("function");
    expect(pages["ingot.base.home"]).toBe(pages["ingot.admin.home"]);
    expect(pages["@/pages/IndexPage.vue"]).toBe(pages["ingot.admin.home"]);
  });

  it("未传 legacy 前缀时不注册旧键", () => {
    const modules: PluginPageGlobModules = {
      "./pages/user/IndexPage.vue": homeLoader,
    };

    const pages = definePluginPages({
      modules,
      sourceRoot: "./pages",
      canonicalPrefix: "ingot.member",
    });

    expect(Object.keys(pages)).toEqual(["ingot.member.user"]);
  });
});
