import type { Component } from "vue";
import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  MenuType,
  defineStaticMenus,
  type AsyncComponentLoader,
  type InAdminPlugin,
} from "@ingot/admin-core";
import BizExampleDemoBadge from "@/components/BizExampleDemoBadge.vue";
import { demoHighlightDirective } from "@/directives/demoHighlight";

interface InPageModule {
  default: Component;
}

const pageModules = import.meta.glob<InPageModule>("./pages/demo/**/IndexPage.vue");

const pageKeyByFile: Record<string, string> = {
  "./pages/demo/overview/IndexPage.vue": "example.demo.overview",
  "./pages/demo/shared-state/IndexPage.vue": "example.demo.shared-state",
  "./pages/demo/components/IndexPage.vue": "example.demo.components",
};

const pages: Record<string, AsyncComponentLoader> = {};
Object.entries(pageModules).forEach(([path, loader]) => {
  const pageKey = pageKeyByFile[path];
  if (!pageKey) {
    return;
  }
  pages[pageKey] = async () => (await loader()).default;
});

export const EXAMPLE_PLUGIN_META = {
  id: "example-admin-plugin",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"] as const,
  pageKeys: Object.values(pageKeyByFile),
};

export const exampleAdminPlugin: InAdminPlugin = {
  id: EXAMPLE_PLUGIN_META.id,
  apiVersion: EXAMPLE_PLUGIN_META.apiVersion,
  dependsOn: [...EXAMPLE_PLUGIN_META.dependsOn],
  pages,
  components: {
    BizExampleDemoBadge,
  },
  directives: {
    "demo-highlight": demoHighlightDirective,
  },
  staticMenus: defineStaticMenus([
    {
      name: "插件示例",
      path: "/example-demo",
      routeName: "ExampleDemoRoot",
      menuType: MenuType.Directory,
      children: [
        {
          name: "概览",
          path: "/example-demo/overview",
          routeName: "ExampleDemoOverview",
          menuType: MenuType.Menu,
          viewPath: "example.demo.overview",
        },
        {
          name: "共享状态",
          path: "/example-demo/shared-state",
          routeName: "ExampleDemoSharedState",
          menuType: MenuType.Menu,
          viewPath: "example.demo.shared-state",
        },
        {
          name: "组件",
          path: "/example-demo/components",
          routeName: "ExampleDemoComponents",
          menuType: MenuType.Menu,
          viewPath: "example.demo.components",
        },
      ],
    },
  ]),
};
