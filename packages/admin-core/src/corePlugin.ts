import type { Component } from "vue";
import vue3TreeOrg from "vue3-tree-org";
import "vue3-tree-org/lib/vue3-tree-org.css";
import { coreGlobalComponents } from "./components/coreComponents";
import { coreDirectives } from "./directive";
import type { InAdminPlugin } from "./plugin";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "./plugin";
import { configurePageResolver } from "./router/constants";
import { guardManager } from "./router/guard";
import routes from "./router/routes";

const loadComponent = async (loader: () => Promise<{ default: Component }>): Promise<Component> => {
  const module = await loader();
  return module.default;
};

const mainLayout = () => loadComponent(() => import("./layouts/InAppLayout.vue"));
const simpleLayout = () => loadComponent(() => import("./layouts/InSimpleLayout.vue"));
const iframeLayout = () => loadComponent(() => import("./layouts/InIFrameLayout.vue"));
const externalLayout = () => loadComponent(() => import("./layouts/InExtLinkLayout.vue"));
const unavailablePage = () =>
  loadComponent(() => import("./pages/common/plugin-unavailable/IndexPage.vue"));

export const adminCorePlugin: InAdminPlugin = {
  id: "ingot-admin-core",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  pages: {
    "ingot.layout.main": mainLayout,
    "ingot.layout.simple": simpleLayout,
    "ingot.layout.iframe": iframeLayout,
    "ingot.layout.external": externalLayout,
    "ingot.common.plugin-unavailable": unavailablePage,
    "@/layouts/InAppLayout.vue": mainLayout,
    "@/layouts/InSimpleLayout.vue": simpleLayout,
    "@/layouts/InIFrameLayout.vue": iframeLayout,
    "@/layouts/InExtLinkLayout.vue": externalLayout,
  },
  components: coreGlobalComponents,
  directives: coreDirectives,
  staticRoutes: routes,
  vuePlugins: [vue3TreeOrg],
  install: ({ appCode, resolvePage, router }) => {
    configurePageResolver(appCode, resolvePage);
    guardManager.install(router);
  },
};
