import type { Component } from "vue";
import {
  MenuType,
  defineAppLocalPlugin,
  defineStaticMenus,
  toViewPrefix,
  type InAdminPlugin,
} from "@ingot/admin-core";
import BizTargetDemoBadge from "@/components/BizTargetDemoBadge.vue";
import { demoHighlightDirective } from "@/directives/demoHighlight";

interface InPageModule {
  default: Component;
}

export const createTargetPlugin = (appCode: string): InAdminPlugin => {
  const prefix = toViewPrefix(appCode);
  const overviewKey = `${prefix}.demo.overview`;

  return defineAppLocalPlugin({
    appCode,
    id: "{{pluginId}}",
    pageModules: import.meta.glob<InPageModule>("../pages/**/*.vue"),
    pageSourceRoot: "../pages",
    layoutModules: import.meta.glob<InPageModule>("../layouts/**/*.vue"),
    layoutSourceRoot: "../layouts",
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
            viewPath: overviewKey,
          },
        ],
      },
    ]),
  });
};

declare module "vue" {
  export interface GlobalComponents {
    BizTargetDemoBadge: typeof BizTargetDemoBadge;
  }
}
