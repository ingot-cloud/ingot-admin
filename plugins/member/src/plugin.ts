import type { Component } from "vue";
import {
  definePluginPages,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "@ingot/admin-core";

interface InPageModule {
  default: Component;
}

const modules = import.meta.glob<InPageModule>("./pages/**/*.vue");

export const memberPlugin: InAdminPlugin = {
  id: "ingot-member",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages: definePluginPages({
    modules,
    sourceRoot: "./pages",
    canonicalPrefix: "ingot.member",
    legacySemanticPrefix: "platform.member",
    legacyFilePrefix: "@/pages/platform/member",
  }),
};
