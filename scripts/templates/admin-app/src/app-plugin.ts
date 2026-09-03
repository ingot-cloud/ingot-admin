import {
  defineAppLocalPlugin,
  type InAdminPlugin,
  type PluginComponentGlobModule,
  type PluginDirectiveGlobModule,
  type PluginPageGlobModule,
} from "@ingot/admin-core";

/**
 * App 约定本地插件。在 pages / layouts / components / directives 下新增文件即可，不必改此文件。
 */
export const createAppLocalPlugin = (
  appCode: string,
  extras?: {
    id?: string;
    staticMenus?: InAdminPlugin["staticMenus"];
  },
): InAdminPlugin =>
  defineAppLocalPlugin({
    appCode,
    id: extras?.id,
    staticMenus: extras?.staticMenus,
    pageModules: import.meta.glob<PluginPageGlobModule>("./pages/**/*.vue"),
    pageSourceRoot: "./pages",
    layoutModules: import.meta.glob<PluginPageGlobModule>("./layouts/**/*.vue"),
    layoutSourceRoot: "./layouts",
    componentModules: import.meta.glob<PluginComponentGlobModule>("./components/**/*.vue", {
      eager: true,
    }),
    directiveModules: import.meta.glob<PluginDirectiveGlobModule>("./directives/**/*.ts", {
      eager: true,
    }),
  });
