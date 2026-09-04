import type { Router } from "vue-router";
import type {
  InAdminAppOptions,
  InBrandingConfig,
  InComponentSize,
  InLoginConfig,
  InNetConfig,
  InSettingsConfig,
  InStaticMenuNode,
  InStorageConfig,
} from "./plugin";
import { resetAdminQueryClient } from "./query";
import { mergeMenuTrees } from "./router/helper/menus";

export interface InResolvedBrandingConfig {
  title: string;
  logo?: string;
  copyright: string;
  symbol: string;
}

export interface InResolvedNetConfig {
  baseURL?: string;
  timeout: number;
  timeoutErrorMessage?: string;
}

export interface InResolvedSettingsConfig {
  componentSize: InComponentSize;
  showMenu: boolean;
  showTabs: boolean;
  showBreadcrumb: boolean;
  showCopyright: boolean;
  showSearch: boolean;
  showWatermark: boolean;
}

export interface InResolvedAppConfig {
  appCode: string;
  branding: InResolvedBrandingConfig;
  login: Required<InLoginConfig>;
  net: InResolvedNetConfig;
  storage: InStorageConfig;
  settings: InResolvedSettingsConfig;
  basicToken: string;
  bucketName: string;
  publicPath: string;
  staticMenus: InStaticMenuNode[];
}

const DEFAULT_CONFIG: InResolvedAppConfig = {
  appCode: "ingot-admin",
  branding: {
    title: "Ingot",
    copyright: "",
    symbol: "ingot",
  },
  login: {
    loginUri: "",
    callbackUri: "",
    errorImage: "",
    fingerprintEnabled: false,
  },
  net: {
    timeout: 10_000,
  },
  storage: {
    storePrefix: "__ingot__",
    cookieDomain: "",
    cookieExpireTime: 7200,
  },
  settings: {
    componentSize: "default",
    showMenu: true,
    showTabs: false,
    showBreadcrumb: true,
    showCopyright: true,
    showSearch: true,
    showWatermark: true,
  },
  basicToken: "",
  bucketName: "ingot",
  publicPath: "/",
  staticMenus: [],
};

let runtimeConfig: InResolvedAppConfig = {
  ...DEFAULT_CONFIG,
  branding: { ...DEFAULT_CONFIG.branding },
  login: { ...DEFAULT_CONFIG.login },
  net: { ...DEFAULT_CONFIG.net },
  storage: { ...DEFAULT_CONFIG.storage },
  settings: { ...DEFAULT_CONFIG.settings },
  staticMenus: [],
};
let adminRouter: Router | undefined;

const resolveBranding = (branding: InBrandingConfig): InResolvedBrandingConfig => ({
  title: branding.title,
  logo: branding.logo,
  copyright: branding.copyright ?? "",
  symbol: branding.symbol ?? "ingot",
});

const resolveLogin = (login: InLoginConfig): Required<InLoginConfig> => ({
  loginUri: login.loginUri,
  callbackUri: login.callbackUri,
  errorImage: login.errorImage ?? "",
  fingerprintEnabled: login.fingerprintEnabled,
});

const resolveNet = (net?: InNetConfig): InResolvedNetConfig => ({
  baseURL: net?.baseURL,
  timeout: net?.timeout ?? 10_000,
  timeoutErrorMessage: net?.timeoutErrorMessage,
});

const resolveStorage = (storage?: InStorageConfig): InStorageConfig => ({
  storePrefix: storage?.storePrefix ?? DEFAULT_CONFIG.storage.storePrefix,
  cookieDomain: storage?.cookieDomain ?? DEFAULT_CONFIG.storage.cookieDomain,
  cookieExpireTime: storage?.cookieExpireTime ?? DEFAULT_CONFIG.storage.cookieExpireTime,
});

const resolveSettings = (settings?: InSettingsConfig): InResolvedSettingsConfig => ({
  componentSize: settings?.componentSize ?? DEFAULT_CONFIG.settings.componentSize,
  showMenu: settings?.showMenu ?? DEFAULT_CONFIG.settings.showMenu,
  showTabs: settings?.showTabs ?? DEFAULT_CONFIG.settings.showTabs,
  showBreadcrumb: settings?.showBreadcrumb ?? DEFAULT_CONFIG.settings.showBreadcrumb,
  showCopyright: settings?.showCopyright ?? DEFAULT_CONFIG.settings.showCopyright,
  showSearch: settings?.showSearch ?? DEFAULT_CONFIG.settings.showSearch,
  showWatermark: settings?.showWatermark ?? DEFAULT_CONFIG.settings.showWatermark,
});

export const resolveAdminAppConfig = (options: InAdminAppOptions): InResolvedAppConfig => ({
  appCode: options.appCode,
  branding: resolveBranding(options.branding),
  login: resolveLogin(options.login),
  net: resolveNet(options.net),
  storage: resolveStorage(options.storage),
  settings: resolveSettings(options.settings),
  basicToken: options.basicToken ?? "",
  bucketName: options.bucketName ?? "ingot",
  publicPath: options.publicPath ?? "/",
  staticMenus: mergeMenuTrees(
    options.staticMenus ?? [],
    options.plugins.flatMap((plugin) => plugin.staticMenus ?? []),
  ),
});

export const configureAdminRuntime = (options: InAdminAppOptions): InResolvedAppConfig => {
  runtimeConfig = resolveAdminAppConfig(options);
  return runtimeConfig;
};

export const bindAdminRouter = (router: Router): void => {
  adminRouter = router;
};

export const getAdminRuntimeConfig = (): InResolvedAppConfig => runtimeConfig;

export const getAdminRouter = (): Router => {
  if (!adminRouter) {
    throw new Error("管理台 Router 尚未绑定，请先调用 bootstrapAdminApp");
  }
  return adminRouter;
};

export const resetAdminRuntime = (): void => {
  resetAdminQueryClient();
  runtimeConfig = {
    ...DEFAULT_CONFIG,
    branding: { ...DEFAULT_CONFIG.branding },
    login: { ...DEFAULT_CONFIG.login },
    net: { ...DEFAULT_CONFIG.net },
    storage: { ...DEFAULT_CONFIG.storage },
    settings: { ...DEFAULT_CONFIG.settings },
    staticMenus: [],
  };
  adminRouter = undefined;
};
