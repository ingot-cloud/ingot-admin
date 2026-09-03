import type { AliasOptions, PluginOption, ProxyOptions, UserConfig } from "vite";
import type { ImportsMap } from "unplugin-auto-import/types";
import type { InOfficialPluginOption } from "./official-plugins.js";

export interface InViteBaseOptions {
  rootDir: string;
  aliases?: AliasOptions;
  componentDirs?: string[];
  hookDirs?: string[];
  /**
   * 管理台约定目录守卫。为 true 时扫描组件 In*、El* 前缀与 hook/store 保留导出名。
   * 仅 `apps/admin` 与 create-app 生成的后台开启；`apps/auth` 不要开。
   */
  enforceAppConventions?: boolean;
  iconDir?: string;
  enableDevTools?: boolean;
  extraPlugins?: PluginOption[];
  autoImports?: ImportsMap;
  /**
   * 官方源码插件包名或配置。省略时根据当前 package.json 的 name / dependencies
   * 自动识别已知官方插件（platform / security / org / member）。
   */
  officialPlugins?: Array<string | InOfficialPluginOption>;
  extend?: UserConfig;
}

export interface InAppViteOptions extends InViteBaseOptions {
  port: number;
  host?: string;
  proxy?: Record<string, string | ProxyOptions>;
}

export interface InLibraryViteOptions extends InViteBaseOptions {
  entry: string;
  name: string;
  fileName?: string;
  external?: Array<string | RegExp>;
}
