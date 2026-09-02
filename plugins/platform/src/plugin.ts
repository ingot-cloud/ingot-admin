import type { Component } from "vue";
import {
  definePluginPages,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "@ingot/admin-core";
import { domainGlobalComponents } from "./components/global";

interface InPageModule {
  default: Component;
}

const modules = import.meta.glob<InPageModule>("./pages/**/*.vue");

const pages = definePluginPages({
  modules,
  sourceRoot: "./pages",
  canonicalPrefix: "ingot.platform",
  legacySemanticPrefix: "platform",
  legacyFilePrefix: "@/pages/platform",
});

const dashboardLoader = pages["ingot.platform.dashboard"];
if (dashboardLoader) {
  pages["ingot.admin.dashboard"] = dashboardLoader;
  pages["ingot.base.dashboard"] = dashboardLoader;
  pages["@/pages/dashboard/IndexPage.vue"] = dashboardLoader;
}

export const platformPlugin: InAdminPlugin = {
  id: "ingot-platform",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages,
  components: domainGlobalComponents,
};
