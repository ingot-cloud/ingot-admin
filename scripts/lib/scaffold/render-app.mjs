import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILTIN_ENV_FIELDS } from "./constants.mjs";
import { envFileName, serializeEnvFile } from "./env.mjs";
import { ensureGitkeep, loadTemplateFiles, removePrefix, upsertFile } from "./files.mjs";
import { quoteTs } from "./identifiers.mjs";
import { catalogMetaFor, resolveSelectedPlugins, resolveSelectedTheme } from "./catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APP_TEMPLATE_DIR = path.join(__dirname, "../../templates/admin-app");

const utilityConst = {
  fullscreen: "InAdminHeaderBuiltinUtilityName.Fullscreen",
  settings: "InAdminHeaderBuiltinUtilityName.Settings",
};

const userMenuConst = {
  switchOrg: "InAdminHeaderBuiltinUserMenuName.SwitchOrg",
  fixPwd: "InAdminHeaderBuiltinUserMenuName.FixPwd",
  logout: "InAdminHeaderBuiltinUserMenuName.Logout",
};

const tsStringArray = (values) => `[${values.map((value) => quoteTs(value)).join(", ")}]`;

const renderEnvFiles = (options) => {
  const files = [];
  const common = { ...options.env.common };
  for (const field of BUILTIN_ENV_FIELDS) {
    if (field.output === "custom-only" && !(field.key in common)) {
      delete common[field.key];
    }
  }
  files.push({ path: ".env", kind: "text", content: serializeEnvFile(common) });
  for (const [mode, values] of Object.entries(options.env.modes)) {
    if (Object.keys(values).length === 0) {
      files.push({ path: envFileName(mode), kind: "text", content: "" });
      continue;
    }
    files.push({ path: envFileName(mode), kind: "text", content: serializeEnvFile(values) });
  }
  return files;
};

const renderPluginsTs = (plugins, withDemo) => {
  const officialImports = plugins
    .map((plugin) => `import { ${plugin.exportName} } from ${quoteTs(plugin.packageName)};`)
    .join("\n");
  const list = plugins.map((plugin) => plugin.exportName).join(", ");
  const demoImport = withDemo ? `import { createDemoMenus } from "./demoMenus";\n` : "";
  const localPush = withDemo
    ? `\n  plugins.push(createAppLocalPlugin(appCode, { staticMenus: createDemoMenus(appCode) }));`
    : `\n  plugins.push(createAppLocalPlugin(appCode));`;
  return `import type { InAdminPlugin } from "@ingot/admin-core";
${officialImports ? `${officialImports}\n` : ""}import { createAppLocalPlugin } from "./app-plugin";
${demoImport}
export const createAppPlugins = (appCode: string): InAdminPlugin[] => {
  const plugins: InAdminPlugin[] = [${list}];${localPush}
  return plugins;
};
`;
};

const renderHeaderTs = (header) => {
  const utilities = (header.builtinUtilities ?? []).map((name) => {
    const ident = utilityConst[name];
    return ident ? `    defineHeaderBuiltinUtility(${ident}),` : "";
  });
  const menus = (header.builtinUserMenu ?? []).map((name) => {
    const ident = userMenuConst[name];
    return ident ? `    defineHeaderBuiltinUserMenuItem(${ident}),` : "";
  });
  const brandVisible = header.visibility?.brand !== false;
  const navVisible = header.visibility?.navigation !== false;
  const userVisible = header.visibility?.user !== false;
  return `import {
  defineHeaderBuiltinUserMenuItem,
  defineHeaderBuiltinUtility,
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderBuiltinUtilityName,
  type InAdminHeaderConfig,
} from "@ingot/admin-core";

/**
 * 顶栏集中配置，由 bootstrapAdminApp({ header }) 消费。
 * 响应式回调与自定义组件示例见仓库文档「顶栏」。
 */
export const createAppHeader = (): InAdminHeaderConfig => ({
  brand: { visible: ${brandVisible} },
${navVisible ? "" : "  navigation: { items: [] },\n"}  utilities: [
${utilities.filter(Boolean).join("\n")}
  ],
  user: ${
    userVisible
      ? `{
    menu: [
${menus.filter(Boolean).join("\n")}
    ],
  }`
      : "{ menu: [] }"
  },
});
`;
};

const renderMainTs = ({ appCode, theme, options }) => {
  const themeImport =
    theme.kind === "default"
      ? `import { bootstrapAdminApp, defaultAdminTheme, parseBoolean } from "@ingot/admin-core";`
      : `import { bootstrapAdminApp, parseBoolean } from "@ingot/admin-core";\nimport { ${theme.exportName} } from ${quoteTs(theme.packageName)};`;
  const themeValue = theme.kind === "default" ? "defaultAdminTheme" : theme.exportName;
  const cssImport =
    theme.kind === "default"
      ? `import "@ingot/admin-core/style.css";`
      : `import ${quoteTs(theme.cssExport)};`;
  const netExt = options.extensions.netInterceptors
    ? `\nimport { createNetInterceptors } from "./net-interceptors";`
    : "";
  const shellExt = options.extensions.shellSlots
    ? `\nimport { createShellSlots } from "./shell-slots";`
    : "";
  const logo = options.branding.logo
    ? `\n    logo: ${quoteTs(options.branding.logo)},`
    : "";
  return `${themeImport}
import type { InComponentSize } from "@ingot/admin-core";
${cssImport}
import "uno.css";
import { createAppHeader } from "./header";
import { createAppPlugins } from "./plugins";${netExt}${shellExt}

const env = import.meta.env;
const componentSize = (env.VITE_APP_SETTINGS_COMPONENT_SIZE || "default") as InComponentSize;
const appCode = env.VITE_APP_CODE || ${quoteTs(appCode)};

await bootstrapAdminApp({
  appCode,
  plugins: createAppPlugins(appCode),
  theme: ${themeValue},
  publicPath: import.meta.env.BASE_URL,
  header: createAppHeader(),${shellExt ? "\n  shellSlots: createShellSlots()," : ""}
  branding: {
    title: env.VITE_APP_TITLE,
    copyright: env.VITE_APP_COPYRIGHT,
    symbol: env.VITE_APP_SYMBOL,${logo}
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
    timeoutErrorMessage: env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,${
      options.extensions.netInterceptors ? "\n    interceptors: createNetInterceptors()," : ""
    }
  },
  storage: {
    storePrefix: env.VITE_APP_STORE_PREFIX,
    cookieDomain: env.VITE_APP_COOKIE_DOMAIN,
    cookieExpireTime: Number(env.VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME) || 7200,
  },
  settings: {
    componentSize,
    showMenu: parseBoolean(env.VITE_APP_SETTINGS_SHOW_MENU),
    showBreadcrumb: parseBoolean(env.VITE_APP_SETTINGS_SHOW_BREADCRUMB),
    showCopyright: parseBoolean(env.VITE_APP_SETTINGS_SHOW_COPYRIGHT),
    showSearch: parseBoolean(env.VITE_APP_SETTINGS_SHOW_SEARCH),
    showWatermark: parseBoolean(env.VITE_APP_SETTINGS_SHOW_WATERMARK),
  },
  basicToken: env.VITE_APP_BASIC_TOKEN,
  bucketName: env.VITE_APP_BUCKET_NAME,
});
`;
};

const renderViteConfig = (options, plugins) => {
  const official = plugins.map((plugin) => `    ${quoteTs(plugin.packageName)},`).join("\n");
  const proxyEntries = options.proxy.map((rule) => {
    const rewrite = rule.stripPrefix
      ? `\n      rewrite: (path) => path.replace(new RegExp(${quoteTs(`^${rule.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=/|$)`)}), "") || "/",`
      : "";
    return `    ${quoteTs(rule.prefix)}: {
      target: ${quoteTs(rule.target)},
      changeOrigin: ${rule.changeOrigin !== false},${rewrite}
    },`;
  });
  const extra = options.iconify.extra.length
    ? `\n    extra: ${tsStringArray(options.iconify.extra)},`
    : "";
  const viteExt = options.extensions.vite
    ? `\n  extraPlugins: [],\n  extend: appViteExtend,`
    : "";
  const viteExtImport = options.extensions.vite
    ? `\nimport { appViteExtend } from "./vite.extend";`
    : "";
  return `import { fileURLToPath } from "node:url";
import { defineInAppConfig } from "@ingot/vite-config";${viteExtImport}

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInAppConfig({
  rootDir,
  port: ${Number(options.dev.port)},
  host: ${quoteTs(options.dev.host)},
  base: ${quoteTs(options.build.base)},
  enableDevTools: ${options.dev.enableDevTools !== false},
  iconDir: fileURLToPath(new URL("../../packages/admin-core/src/assets/icons", import.meta.url)),
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
  enforceAppConventions: true,
  officialPlugins: [
${official}
  ],
  iconifyOffline: {
    collections: ${tsStringArray(options.iconify.collections)},${extra}
    scan: ${options.iconify.scan !== false},
    usedFile: ${quoteTs(options.iconify.usedFile)},
  },
  proxy: {
${proxyEntries.join("\n")}
  },${viteExt}
});
`;
};

const renderEnvDts = () => `/// <reference types="vite/client" />
declare module "uno.css";
declare module "virtual:iconify-offline";
declare module "virtual:ingot-iconify-icon" {
  import type { Component } from "vue";
  export const Icon: Component;
  export function loadIcon(name: string): Promise<{ body: string } | null>;
  export function getIcon(name: string): {
    body: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
  } | null;
}
interface ImportMetaEnv {
  readonly VITE_APP_CODE: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_SYMBOL: string;
  readonly VITE_APP_STORE_PREFIX: string;
  readonly VITE_APP_COOKIE_DOMAIN: string;
  readonly VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME: string;
  readonly VITE_APP_NET_BASE_URL: string;
  readonly VITE_APP_NET_DEFAULT_TIMEOUT: string;
  readonly VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE: string;
  readonly VITE_APP_BASIC_TOKEN: string;
  readonly VITE_APP_BUCKET_NAME: string;
  readonly VITE_APP_COPYRIGHT: string;
  readonly VITE_APP_LOGIN_URI: string;
  readonly VITE_APP_LOGIN_CALLBACK_URI: string;
  readonly VITE_APP_ERROR_IMAGE: string;
  readonly VITE_APP_SETTINGS_COMPONENT_SIZE: string;
  readonly VITE_APP_SETTINGS_SHOW_MENU: string;
  readonly VITE_APP_SETTINGS_SHOW_BREADCRUMB: string;
  readonly VITE_APP_SETTINGS_SHOW_COPYRIGHT: string;
  readonly VITE_APP_SETTINGS_SHOW_SEARCH: string;
  readonly VITE_APP_SETTINGS_SHOW_WATERMARK: string;
  readonly VITE_APP_FINGERPRINT_ENABLED: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`;

const patchPackageJson = (content, plugins, theme) => {
  const pkg = JSON.parse(content);
  for (const key of Object.keys(pkg.dependencies ?? {})) {
    if (key.endsWith("-plugin") && key.startsWith("@ingot/")) {
      delete pkg.dependencies[key];
    }
    if (key.startsWith("@ingot/theme-")) {
      delete pkg.dependencies[key];
    }
  }
  for (const plugin of plugins) {
    pkg.dependencies[plugin.packageName] = "workspace:*";
  }
  if (theme.kind === "workspace") {
    pkg.dependencies[theme.packageName] = "workspace:*";
  }
  return `${JSON.stringify(pkg, null, 2)}\n`;
};

const netInterceptorSample = `import {
  AdminNetInterceptorOrder,
  defineRequestInterceptor,
  defineResponseInterceptor,
  type PreFilter,
  type PostFilter,
} from "@ingot/admin-core";

/** 在 Vite 扩展或业务代码中按需增删拦截器；本文件由脚手架生成接线。 */
export const createNetInterceptors = (): Array<PreFilter | PostFilter> => [
  defineRequestInterceptor({
    name: "app-request-log",
    order: AdminNetInterceptorOrder.App,
    fulfilled(config) {
      return config;
    },
  }),
  defineResponseInterceptor({
    name: "app-response-passthrough",
    order: AdminNetInterceptorOrder.App,
    fulfilled(response) {
      return response;
    },
  }),
];
`;

const shellSlotsSample = `import type { Component } from "vue";
import type { AdminShellSlot } from "@ingot/admin-core";

/** 外壳插槽示例。未实现的槽位不要写进对象。 */
export const createShellSlots = (): Partial<Record<AdminShellSlot, Component>> => ({});
`;

const viteExtendSample = `import type { UserConfig } from "vite";

/** 复杂 Vite 逻辑（aliases / autoImports / extraPlugins / extend）写在这里。 */
export const appViteExtend: UserConfig = {};
`;

export const renderAppFiles = (rootDir, options) => {
  const plugins = resolveSelectedPlugins(rootDir, options.plugins);
  const theme = resolveSelectedTheme(rootDir, options.theme);
  const tokens = {
    appCode: options.appCode,
    appTitle: options.env.common.VITE_APP_TITLE || options.appCode,
    port: String(options.dev.port),
    storePrefix: options.env.common.VITE_APP_STORE_PREFIX,
    pluginId: `${options.appCode}-feature`,
    pageKeyPrefix: options.appCode.replace(/-/g, "."),
  };
  let files = loadTemplateFiles(APP_TEMPLATE_DIR, tokens);
  files = files.filter((file) => file.path !== ".env");
  for (const envFile of renderEnvFiles(options)) {
    files = upsertFile(files, envFile.path, envFile.content);
  }
  files = upsertFile(files, "src/plugins.ts", renderPluginsTs(plugins, options.withDemo));
  files = upsertFile(files, "src/header.ts", renderHeaderTs(options.header));
  files = upsertFile(files, "src/main.ts", renderMainTs({ appCode: options.appCode, theme, options }));
  files = upsertFile(files, "vite.config.ts", renderViteConfig(options, plugins));
  files = upsertFile(files, "env.d.ts", renderEnvDts());
  const pkg = files.find((file) => file.path === "package.json");
  if (pkg) {
    files = upsertFile(files, "package.json", patchPackageJson(pkg.content, plugins, theme));
  }
  files = files.filter((file) => !file.path.endsWith("-plugin.d.ts"));
  if (!options.withDemo) {
    files = removePrefix(files, "src/pages/demo/");
    files = files.filter(
      (file) =>
        file.path !== "src/demoMenus.ts" &&
        !file.path.startsWith("src/components/") &&
        !file.path.startsWith("src/directives/") &&
        !file.path.startsWith("src/stores/"),
    );
    for (const dir of ["src/pages", "src/layouts", "src/components", "src/hooks", "src/directives", "src/stores"]) {
      files = ensureGitkeep(files, dir);
    }
  }
  if (options.extensions.netInterceptors) {
    files = upsertFile(files, "src/net-interceptors.ts", netInterceptorSample);
  }
  if (options.extensions.shellSlots) {
    files = upsertFile(files, "src/shell-slots.ts", shellSlotsSample);
  }
  if (options.extensions.vite) {
    files = upsertFile(files, "vite.extend.ts", viteExtendSample);
  }
  return { files, plugins, theme, catalogMeta: catalogMetaFor(rootDir, { kind: "app", options }) };
};

export const appNextSteps = (options) => [
  { title: "安装依赖", command: "pnpm install" },
  {
    title: "启动应用",
    command: `pnpm --filter ${options.appCode} dev`,
  },
  {
    title: "核对环境与回调",
    command: `编辑 apps/${options.appCode}/.env 与 .env.production，确认登录回调与部署地址`,
  },
  {
    title: "文档",
    code: "docs/guide/getting-started.md",
    language: "text",
  },
];
