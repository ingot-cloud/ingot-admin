import type { Component } from "vue";
import vue3TreeOrg from "vue3-tree-org";
import "vue3-tree-org/lib/vue3-tree-org.css";
import { coreGlobalComponents } from "./components/coreComponents";
import { coreDirectives } from "./directive";
import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  definePluginPages,
  type InAdminPlugin,
} from "./plugin";
import { configurePageResolver } from "./router/constants";
import { guardManager } from "./router/guard";
import routes from "./router/routes";

interface InPageModule {
  default: Component;
}

const commonPageModules = import.meta.glob<InPageModule>("./pages/common/**/*.vue");
/** 只扫 `layouts/{slot}/IndexPage.vue`，不扫 widgets */
const layoutModules = import.meta.glob<InPageModule>("./layouts/*/IndexPage.vue");

export const adminCorePlugin: InAdminPlugin = {
  id: "ingot-admin-core",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  pages: definePluginPages({
    modules: commonPageModules,
    sourceRoot: "./pages/common",
    canonicalPrefix: "common",
  }),
  layouts: definePluginPages({
    modules: layoutModules,
    sourceRoot: "./layouts",
    canonicalPrefix: "layout",
  }),
  components: coreGlobalComponents,
  directives: coreDirectives,
  staticRoutes: routes,
  vuePlugins: [vue3TreeOrg],
  install: ({ appCode, resolvePage, listViews, router }) => {
    configurePageResolver(appCode, resolvePage, listViews);
    guardManager.install(router);
  },
};
