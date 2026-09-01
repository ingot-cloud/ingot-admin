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
  "../pages/demo/overview/IndexPage.vue": "target.demo.overview",
  "../pages/demo/shared-state/IndexPage.vue": "target.demo.shared-state",
  "../pages/demo/components/IndexPage.vue": "target.demo.components",
};

const pages: Record<string, AsyncComponentLoader> = {};
Object.entries(pageModules).forEach(([path, loader]) => {
  const pageKey = pageKeyByFile[path];
  if (!pageKey) {
    return;
  }
  pages[pageKey] = async () => (await loader()).default;
});

export const TARGET_PLUGIN_META = {
  id: "target-feature",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin"] as const,
  pageKeys: Object.values(pageKeyByFile),
};

export const targetPlugin: InAdminPlugin = {
  id: TARGET_PLUGIN_META.id,
  apiVersion: TARGET_PLUGIN_META.apiVersion,
  dependsOn: [...TARGET_PLUGIN_META.dependsOn],
  pages,
  components: {
    BizTargetDemoBadge,
  },
  directives: {
    "demo-highlight": demoHighlightDirective,
  },
  staticMenus: defineStaticMenus([
    {
      name: "Target Demo",
      path: "/target-demo",
      routeName: "TargetDemoRoot",
      menuType: MenuType.Directory,
      children: [
        {
          name: "D · 概览",
          path: "/target-demo/overview",
          routeName: "TargetDemoOverview",
          menuType: MenuType.Menu,
          viewPath: "target.demo.overview",
        },
        {
          name: "E · 共享状态",
          path: "/target-demo/shared-state",
          routeName: "TargetDemoSharedState",
          menuType: MenuType.Menu,
          viewPath: "target.demo.shared-state",
        },
        {
          name: "F · 组件",
          path: "/target-demo/components",
          routeName: "TargetDemoComponents",
          menuType: MenuType.Menu,
          viewPath: "target.demo.components",
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
