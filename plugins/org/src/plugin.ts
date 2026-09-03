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

export const orgPlugin: InAdminPlugin = {
  id: "ingot-org",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages: definePluginPages({
    modules,
    sourceRoot: "./pages",
    canonicalPrefix: "org",
  }),
  components: domainGlobalComponents,
};
