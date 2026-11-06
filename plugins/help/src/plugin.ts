import type { Component } from "vue";
import {
  definePluginPages,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "@ingot/admin-core";
import { helpNavigationKey } from "@ingot/admin-common";
import { createHelpRuntime, helpRuntimeKey } from "./runtime";
import type { HelpEntry } from "./models/help";
import type { HelpContentProvider } from "./content/types";
import "./style.css";
export { useHelpNavigation } from "@ingot/admin-common";

interface PageModule {
  default: Component;
}
const modules = import.meta.glob<PageModule>("./pages/**/*.vue");

/** 两宿主只装配自己的内容入口；共享阅读插件不导入任一宿主资料。 */
export function createHelpPlugin(options: {
  entry: HelpEntry;
  loadContent: () => Promise<HelpContentProvider>;
}): InAdminPlugin {
  return {
    id: "ingot-help",
    apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
    dependsOn: ["ingot-admin-core"],
    pages: definePluginPages({ modules, sourceRoot: "./pages", canonicalPrefix: "help" }),
    staticRoutes: [
      {
        path: "/help",
        component: () => import("./layouts/HelpReaderLayout.vue"),
        meta: { title: "帮助中心", hideMenu: true, hideBreadcrumb: true, helpReader: true },
        children: [
          { path: "", name: "help.home", component: () => import("./pages/home/IndexPage.vue") },
          {
            path: "categories/:categoryId",
            name: "help.category",
            component: () => import("./pages/category/IndexPage.vue"),
          },
          {
            path: "search",
            name: "help.search",
            component: () => import("./pages/search/IndexPage.vue"),
          },
          {
            path: "articles/:articleId",
            name: "help.article",
            component: () => import("./pages/article/IndexPage.vue"),
          },
        ],
      },
    ],
    install({ app, router, queryClient }) {
      const runtime = createHelpRuntime(options.entry, router, queryClient, options.loadContent);
      app.provide(helpRuntimeKey, runtime);
      app.provide(helpNavigationKey, runtime);
    },
  };
}

export { createStaticHelpProvider } from "./content/static";
export { commonHelpContent } from "./content/common";
export type {
  HelpContentProvider,
  HelpContentDefinition,
  HelpContentSources,
} from "./content/types";
