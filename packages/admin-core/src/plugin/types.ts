import type { Pinia } from "pinia";
import type { App, Component, Directive, Plugin as VuePlugin } from "vue";
import type { RouteRecordRaw, Router } from "vue-router";
import type { MenuTreeNode } from "../models/menu";

/** 插件契约版本。不兼容的版本会在启动时拒绝加载。 */
export const INGOT_ADMIN_PLUGIN_API_VERSION = 1 as const;

export type PageKey = string;
export type AsyncComponentLoader = () => Promise<Component>;

/** 与后端菜单节点同构，供 `transformMenu` 解析 `viewPath` */
export type InStaticMenuNode = MenuTreeNode;

export interface InAdminPluginContext {
  app: App;
  appCode: string;
  pinia: Pinia;
  router: Router;
  resolvePage: (pageKey: PageKey) => AsyncComponentLoader | undefined;
}

/**
 * 构建期插件描述。由 `bootstrapAdminApp({ plugins })` 在启动时注册，
 * 不会在运行时远程加载。
 */
export interface InAdminPlugin {
  /** kebab-case 全局唯一 ID，官方 App 插件使用 App 名，如 `ingot-admin` */
  id: string;
  apiVersion: typeof INGOT_ADMIN_PLUGIN_API_VERSION;
  /** 必须先于本插件加载的插件 ID；官方业务插件需包含 `ingot-admin-core` */
  dependsOn?: string[];
  /** 稳定页面键 → 异步组件。推荐 `ingot.admin.*`，兼容期可同时注册 `ingot.base.*` 与 `@/pages/**` */
  pages?: Record<PageKey, AsyncComponentLoader>;
  components?: Record<string, Component>;
  directives?: Record<string, Directive>;
  vuePlugins?: VuePlugin[];
  /** 隐藏公共路由（403/404 等），不参与侧栏 */
  staticRoutes?: RouteRecordRaw[];
  /**
   * 参与侧栏的静态菜单树，`viewPath` 走同一套 page registry。
   * 与 App 级 `staticMenus`、后端动态菜单经 `mergeMenuTrees` 合并。
   */
  staticMenus?: InStaticMenuNode[];
  install?: (context: InAdminPluginContext) => void | Promise<void>;
}

export interface InBrandingConfig {
  title: string;
  logo?: string;
  copyright?: string;
  symbol?: string;
}

export interface InLoginConfig {
  loginUri: string;
  callbackUri: string;
  errorImage?: string;
  fingerprintEnabled: boolean;
}

export interface InNetConfig {
  baseURL?: string;
  timeout?: number;
  timeoutErrorMessage?: string;
}

export interface InStorageConfig {
  storePrefix: string;
  cookieDomain: string;
  cookieExpireTime: number;
}

export type InComponentSize = "large" | "default" | "small";

export interface InSettingsConfig {
  componentSize?: InComponentSize;
  showMenu?: boolean;
  showTabs?: boolean;
  showBreadcrumb?: boolean;
  showCopyright?: boolean;
  showSearch?: boolean;
  showWatermark?: boolean;
}

export type AdminShellSlot =
  | "header-start"
  | "header-end"
  | "sidebar-top"
  | "sidebar-bottom";

/**
 * `bootstrapAdminApp` 入参。`plugins` 清单即该 App 的构建开关：
 * 未列入的官方插件不会打进产物。
 */
export interface InAdminAppOptions {
  /** kebab-case 应用编码，同时用于运行时配置 */
  appCode: string;
  mountTarget?: string;
  plugins: InAdminPlugin[];
  branding: InBrandingConfig;
  login: InLoginConfig;
  net?: InNetConfig;
  storage?: InStorageConfig;
  settings?: InSettingsConfig;
  basicToken?: string;
  bucketName?: string;
  publicPath?: string;
  shellSlots?: Partial<Record<AdminShellSlot, Component>>;
  /**
   * App 级静态菜单，与各插件 `staticMenus`、后端动态菜单合并。
   * 仅静态时（后端为空或失败）侧栏仍展示这些菜单。
   */
  staticMenus?: InStaticMenuNode[];
}

export interface InAdminRuntime {
  app: App;
  pinia: Pinia;
  router: Router;
}
