import type { AliasOptions, PluginOption, ProxyOptions, UserConfig } from "vite";
import type { ImportsMap } from "unplugin-auto-import/types";
import type { InOfficialAppPluginOption } from "./official-apps.js";

export interface InViteBaseOptions {
  rootDir: string;
  aliases?: AliasOptions;
  componentDirs?: string[];
  hookDirs?: string[];
  iconDir?: string;
  enableDevTools?: boolean;
  extraPlugins?: PluginOption[];
  autoImports?: ImportsMap;
  /**
   * 官方 App 插件包名或配置。省略时根据当前 package.json 的 name / dependencies 自动识别 `@ingot/admin-app`。
   */
  officialAppPlugins?: Array<string | InOfficialAppPluginOption>;
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
