import { bootstrapAdminApp, parseBoolean } from "@ingot/admin-core";
import type { InComponentSize } from "@ingot/admin-core";
import "@ingot/admin-core/style.css";
import { adminPlugins } from "./plugins";

const env = import.meta.env;
const componentSize = (env.VITE_APP_SETTINGS_COMPONENT_SIZE || "default") as InComponentSize;

await bootstrapAdminApp({
  appCode: env.VITE_APP_CODE || "ingot-admin",
  plugins: adminPlugins,
  branding: {
    title: env.VITE_APP_TITLE,
    copyright: env.VITE_APP_COPYRIGHT,
    symbol: env.VITE_APP_SYMBOL,
  },
  login: {
    loginUri: env.VITE_APP_LOGIN_URI,
    callbackUri: env.VITE_APP_LOGIN_CALLBACK_URI,
    errorImage: env.VITE_APP_ERROR_IMAGE,
    fingerprintEnabled: parseBoolean(env.VITE_APP_FINGERPRINT_ENABLED),
  },
  net: {
    baseURL: env.VITE_APP_NET_BASE_URL || undefined,
    timeout: Number(env.VITE_APP_NET_DEFAULT_TIMEOUT) || 10_000,
    timeoutErrorMessage: env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
  },
  storage: {
    storePrefix: env.VITE_APP_STORE_PREFIX,
    cookieDomain: env.VITE_APP_COOKIE_DOMAIN,
    cookieExpireTime: Number(env.VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME) || 7200,
  },
  settings: {
    componentSize,
    showMenu: parseBoolean(env.VITE_APP_SETTINGS_SHOW_MENU),
    showTabs: parseBoolean(env.VITE_APP_SETTINGS_SHOW_TABS),
    showBreadcrumb: parseBoolean(env.VITE_APP_SETTINGS_SHOW_BREADCRUMB),
    showCopyright: parseBoolean(env.VITE_APP_SETTINGS_SHOW_COPYRIGHT),
    showSearch: parseBoolean(env.VITE_APP_SETTINGS_SHOW_SEARCH),
    showWatermark: parseBoolean(env.VITE_APP_SETTINGS_SHOW_WATERMARK),
  },
  basicToken: env.VITE_APP_BASIC_TOKEN,
  bucketName: env.VITE_APP_BUCKET_NAME,
});
