import { kebabToDot, toCamel, toKebab } from "./identifiers.mjs";
import {
  BUILTIN_ENV_FIELDS,
  CONFIG_VERSION,
  DEFAULT_OFFICIAL_PLUGIN_IDS,
  DEFAULT_THEME,
  HEADER_BUILTIN_USER_MENU,
  HEADER_BUILTIN_UTILITIES,
  IN_THEME_TOKEN_NAMES,
  OFFICIAL_PLUGINS,
  THEME_PARTS,
} from "./constants.mjs";

const storePrefixOf = (appCode) => `__${String(appCode).replace(/-/g, "_")}__`;

export const defaultAppOptions = (appCode = "acme-admin", port = 5800) => {
  const code = toKebab(appCode) || "acme-admin";
  return {
    appCode: code,
    env: {
      common: {
        VITE_APP_CODE: code,
        VITE_APP_TITLE: code,
        VITE_APP_SYMBOL: code,
        VITE_APP_STORE_PREFIX: storePrefixOf(code),
        VITE_APP_COOKIE_DOMAIN: "localhost",
        VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME: "7200",
        VITE_APP_BASIC_TOKEN: "aW5nb3Q6aW5nb3Q=",
        VITE_APP_BUCKET_NAME: "ingot",
        VITE_APP_COPYRIGHT: `© 2018-{0} ${code}`,
        VITE_APP_LOGIN_URI: "http://localhost:1798/oauth2/challenge",
        VITE_APP_LOGIN_CALLBACK_URI: `http://localhost:${port}`,
        VITE_APP_ERROR_IMAGE:
          "https://img.alicdn.com/imgextra/i2/O1CN01DRq3BY1nmVJzaK3AH_!!6000000005132-2-tps-146-232.png",
        VITE_APP_FINGERPRINT_ENABLED: "true",
        VITE_APP_NET_DEFAULT_TIMEOUT: "10000",
        VITE_APP_SETTINGS_COMPONENT_SIZE: "default",
        VITE_APP_SETTINGS_SHOW_MENU: "true",
        VITE_APP_SETTINGS_SHOW_BREADCRUMB: "true",
        VITE_APP_SETTINGS_SHOW_COPYRIGHT: "true",
        VITE_APP_SETTINGS_SHOW_SEARCH: "true",
        VITE_APP_SETTINGS_SHOW_WATERMARK: "false",
      },
      modes: {
        development: {},
        production: {},
      },
    },
    branding: { logo: "" },
    dev: { port, host: "localhost", enableDevTools: true },
    build: { base: "/" },
    proxy: [
      {
        prefix: "/api",
        target: "http://localhost:7980",
        changeOrigin: true,
        stripPrefix: true,
      },
    ],
    iconify: {
      collections: ["ep"],
      extra: [],
      scan: true,
      usedFile: "iconify-offline.used.json",
    },
    plugins: OFFICIAL_PLUGINS.filter((plugin) => DEFAULT_OFFICIAL_PLUGIN_IDS.includes(plugin.id)).map(
      (plugin) => ({
        packageName: plugin.packageName,
        exportName: plugin.exportName,
      }),
    ),
    theme: { kind: "default" },
    withDemo: true,
    header: {
      visibility: { brand: true, navigation: true, search: true, user: true },
      builtinUtilities: [...HEADER_BUILTIN_UTILITIES],
      builtinUserMenu: [...HEADER_BUILTIN_USER_MENU],
    },
    extensions: { netInterceptors: false, shellSlots: false, vite: false },
  };
};

export const defaultPluginOptions = (directoryId = "sales") => {
  const id = toKebab(directoryId) || "sales";
  return {
    directoryId: id,
    pluginId: `ingot-${id}`,
    exportName: `${toCamel(id)}Plugin`,
    canonicalPrefix: kebabToDot(id),
    description: "",
    withDemo: true,
    extensions: {
      layouts: false,
      components: false,
      directives: false,
      stores: false,
      install: false,
    },
  };
};

export const defaultThemeOptions = (id = "horizon") => {
  const themeId = toKebab(id) || "horizon";
  return {
    id: themeId,
    name: themeId,
    exportName: `${toCamel(themeId)}Theme`,
    tokens: { light: {}, dark: {} },
    shell: false,
    parts: [],
  };
};

export const getPublicSchema = () => ({
  version: CONFIG_VERSION,
  envFields: BUILTIN_ENV_FIELDS,
  tokenNames: IN_THEME_TOKEN_NAMES,
  headerUtilities: HEADER_BUILTIN_UTILITIES,
  headerUserMenu: HEADER_BUILTIN_USER_MENU,
  themeParts: THEME_PARTS,
  officialPlugins: OFFICIAL_PLUGINS.map((plugin) => ({
    id: plugin.id,
    packageName: plugin.packageName,
    exportName: plugin.exportName,
    label: plugin.label,
  })),
  defaultTheme: DEFAULT_THEME,
  defaults: {
    app: defaultAppOptions(),
    plugin: defaultPluginOptions(),
    theme: defaultThemeOptions(),
  },
});
