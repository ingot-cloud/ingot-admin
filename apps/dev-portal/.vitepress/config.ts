import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import UnoCSS from "unocss/vite";
import presetWind3 from "@unocss/preset-wind3";
// @ts-expect-error 生成器为 JSDoc mjs，门户只消费 Node 中间件
import { createDevPortalApi } from "../../../scripts/lib/scaffold/http.mjs";

const vitepressDir = path.dirname(fileURLToPath(import.meta.url));
const portalDir = path.resolve(vitepressDir, "..");
const repoRoot = path.resolve(portalDir, "../..");
const port = 5801;
const base = process.env.PORTAL_BASE || "/";

export default defineConfig({
  lang: "zh-CN",
  title: "Ingot 开发者中心",
  description: "Ingot Admin 文档、组件演示与本地创建向导",
  srcDir: ".generated",
  outDir: "dist",
  base,
  cleanUrls: true,
  ignoreDeadLinks: [
    (url: string) =>
      url.includes("../themes/") ||
      url.includes("../examples/") ||
      url.includes("../packages/") ||
      url.includes("../.agents/"),
  ],
  vite: {
    plugins: [
      UnoCSS({
        presets: [presetWind3({ preflight: false })],
      }),
      createDevPortalApi({ rootDir: repoRoot, port }),
      {
        name: "ingot-demo-middleware",
        async configureServer(server) {
          const { createServer } = await import("vite");
          const demoVite = await createServer({
            configFile: path.join(portalDir, "demos/vite.config.ts"),
            base: "/demos/",
            server: { middlewareMode: true },
            appType: "spa",
          });
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith("/demos")) {
              next();
              return;
            }
            const original = req.url;
            req.url = original.slice("/demos".length) || "/";
            demoVite.middlewares(req, res, () => {
              req.url = original;
              next();
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@portal": path.join(portalDir, "src"),
      },
    },
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      open: process.env.PORTAL_OPEN || false,
      fs: {
        allow: [repoRoot],
      },
    },
  },
  themeConfig: {
    siteTitle: "Ingot 开发者中心",
    outline: { label: "本页目录", level: [2, 3] },
    docFooter: { prev: "上一页", next: "下一页" },
    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换到浅色",
    darkModeSwitchTitle: "切换到深色",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "回到顶部",
    nav: [
      { text: "快速开始", link: "/guide/getting-started" },
      { text: "App 开发", link: "/guide/app" },
      { text: "插件开发", link: "/guide/plugin" },
      { text: "主题开发", link: "/guide/theme" },
      { text: "组件", link: "/reference/components" },
      { text: "公共能力", link: "/reference/modules" },
      { text: "工程", link: "/engineering/build" },
      { text: "创建工具", link: "/create/app" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "快速开始", link: "/guide/getting-started" },
            { text: "开发模式", link: "/guide/development-model" },
            { text: "App 开发", link: "/guide/app" },
            { text: "插件开发", link: "/guide/plugin" },
            { text: "主题开发", link: "/guide/theme" },
            { text: "创建工具", link: "/guide/create" },
            { text: "顶栏", link: "/guide/header" },
            { text: "菜单与页面", link: "/guide/menu" },
            { text: "网络", link: "/guide/network" },
            { text: "加密", link: "/guide/crypto" },
            { text: "图标", link: "/guide/icons" },
            { text: "运行时", link: "/guide/runtime" },
          ],
        },
      ],
      "/create/": [
        {
          text: "创建工具",
          items: [
            { text: "创建 App", link: "/create/app" },
            { text: "创建插件", link: "/create/plugin" },
            { text: "创建主题", link: "/create/theme" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "参考",
          items: [
            { text: "组件", link: "/reference/components" },
            { text: "公共能力", link: "/reference/modules" },
            { text: "官方插件", link: "/reference/plugins" },
          ],
        },
      ],
      "/engineering/": [
        {
          text: "工程与部署",
          items: [
            { text: "构建", link: "/engineering/build" },
            { text: "新增 Package", link: "/engineering/package" },
            { text: "TypeScript", link: "/engineering/typescript" },
          ],
        },
      ],
    },
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "搜索", buttonAriaLabel: "搜索文档" },
          modal: {
            displayDetails: "显示详情",
            resetButtonTitle: "清除",
            backButtonTitle: "关闭",
            noResultsText: "没有结果",
            footer: { selectText: "选择", navigateText: "切换", closeText: "关闭" },
          },
        },
      },
    },
  },
});
