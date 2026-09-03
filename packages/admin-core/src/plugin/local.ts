import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "./types";
import { definePluginPages, toViewPrefix, type PluginPageGlobModules } from "./pages";

export interface DefineAppLocalPluginOptions {
  appCode: string;
  id?: string;
  pageModules?: PluginPageGlobModules;
  pageSourceRoot?: string;
  layoutModules?: PluginPageGlobModules;
  layoutSourceRoot?: string;
  components?: InAdminPlugin["components"];
  directives?: InAdminPlugin["directives"];
  staticMenus?: InAdminPlugin["staticMenus"];
}

/**
 * 用与 bootstrap 相同的 appCode 生成本地插件。页面 prefix 为 appCode 转点号，布局再拼 `.layout`。
 */
export const defineAppLocalPlugin = (options: DefineAppLocalPluginOptions): InAdminPlugin => {
  const prefix = toViewPrefix(options.appCode);
  const pages = options.pageModules
    ? definePluginPages({
        modules: options.pageModules,
        sourceRoot: options.pageSourceRoot ?? "./pages",
        canonicalPrefix: prefix,
      })
    : undefined;
  const layouts = options.layoutModules
    ? definePluginPages({
        modules: options.layoutModules,
        sourceRoot: options.layoutSourceRoot ?? "./layouts",
        canonicalPrefix: `${prefix}.layout`,
      })
    : undefined;

  return {
    id: options.id ?? `${options.appCode}-local`,
    apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
    dependsOn: ["ingot-admin-core"],
    pages,
    layouts,
    components: options.components,
    directives: options.directives,
    staticMenus: options.staticMenus,
  };
};
