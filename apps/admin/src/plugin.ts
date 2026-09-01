import type { Component } from "vue";
import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type AsyncComponentLoader,
  type InAdminPlugin,
} from "@ingot/admin-core";
import { adminGlobalComponents } from "./components/global";

interface InPageModule {
  default: Component;
}

const modules = import.meta.glob<InPageModule>("./pages/**/*.vue");
const pages: Record<string, AsyncComponentLoader> = {};

Object.entries(modules).forEach(([path, loader]) => {
  const relativePath = path.slice("./pages/".length);
  const pageLoader: AsyncComponentLoader = async () => (await loader()).default;
  pages[`@/pages/${relativePath}`] = pageLoader;

  if (relativePath.endsWith("/IndexPage.vue") || relativePath === "IndexPage.vue") {
    const semanticPath = relativePath
      .replace(/\/?IndexPage\.vue$/, "")
      .replace(/\//g, ".")
      .replace(/-/g, ".");
    const suffix = semanticPath || "home";
    pages[`ingot.admin.${suffix}`] = pageLoader;
    pages[`ingot.base.${suffix}`] = pageLoader;
  }
});

/**
 * 官方平台 App 插件。可被 `@ingot/admin-app` 自身启动，也可被其他 App 在构建期组合。
 */
export const adminPlugin: InAdminPlugin = {
  id: "ingot-admin",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages,
  components: adminGlobalComponents,
};

export { adminGlobalComponents };
