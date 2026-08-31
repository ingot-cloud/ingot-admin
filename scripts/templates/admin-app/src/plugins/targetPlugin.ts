import type { Component } from "vue";
import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type AsyncComponentLoader,
  type InAdminPlugin,
} from "@ingot/admin-core";
import BizTargetDemoBadge from "@/components/BizTargetDemoBadge.vue";
import { demoHighlightDirective } from "@/directives/demoHighlight";

interface InPageModule {
  default: Component;
}

const pageModules = import.meta.glob<InPageModule>("../pages/demo/**/IndexPage.vue");

const pageKeyByFile: Record<string, string> = {
  "../pages/demo/overview/IndexPage.vue": "{{pageKeyPrefix}}.demo.overview",
};

const pages: Record<string, AsyncComponentLoader> = {};
Object.entries(pageModules).forEach(([path, loader]) => {
  const pageKey = pageKeyByFile[path];
  if (!pageKey) {
    return;
  }
  pages[pageKey] = async () => (await loader()).default;
});

export const targetPlugin: InAdminPlugin = {
  id: "{{pluginId}}",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-base"],
  pages,
  components: {
    BizTargetDemoBadge,
  },
  directives: {
    "demo-highlight": demoHighlightDirective,
  },
};

declare module "vue" {
  export interface GlobalComponents {
    BizTargetDemoBadge: typeof BizTargetDemoBadge;
  }
}
