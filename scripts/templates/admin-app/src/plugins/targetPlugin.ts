import type { Component } from "vue";
import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  MenuType,
  defineStaticMenus,
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
  dependsOn: ["ingot-admin"],
  pages,
  components: {
    BizTargetDemoBadge,
  },
  directives: {
    "demo-highlight": demoHighlightDirective,
  },
  staticMenus: defineStaticMenus([
    {
      name: "本地 Demo",
      path: "/demo",
      routeName: "{{pluginId}}-demo-root",
      menuType: MenuType.Directory,
      children: [
        {
          name: "概览",
          path: "/demo/overview",
          routeName: "{{pluginId}}-demo-overview",
          menuType: MenuType.Menu,
          viewPath: "{{pageKeyPrefix}}.demo.overview",
        },
      ],
    },
  ]),
};

declare module "vue" {
  export interface GlobalComponents {
    BizTargetDemoBadge: typeof BizTargetDemoBadge;
  }
}
