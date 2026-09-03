/**
 * 共享脚手架：从 templates/admin-app 生成 `apps/<appCode>`。
 * CLI（scripts/create-app.mjs）与本地 Web UI（apps/create-app）共用。
 *
 * 安全：仅写入仓库 `apps/` 下尚不存在的目录，拒绝覆盖。
 * 普通单后台项目应直接使用 `apps/admin`；本工具用于创建需要独立运行和部署的 App。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../..");
export const TEMPLATE_DIR = path.join(REPO_ROOT, "scripts/templates/admin-app");

/** @typedef {{ id: string, packageName: string, importPath: string, exportName: string, label: string, available: boolean }} OfficialPluginOption */

/** @type {OfficialPluginOption[]} */
export const OFFICIAL_PLUGINS = [
  {
    id: "ingot-platform",
    packageName: "@ingot/platform-plugin",
    importPath: "@ingot/platform-plugin",
    exportName: "platformPlugin",
    label: "@ingot/platform-plugin（平台控制面）",
    available: true,
  },
  {
    id: "ingot-security",
    packageName: "@ingot/security-plugin",
    importPath: "@ingot/security-plugin",
    exportName: "securityPlugin",
    label: "@ingot/security-plugin（安全中心）",
    available: true,
  },
  {
    id: "ingot-org",
    packageName: "@ingot/org-plugin",
    importPath: "@ingot/org-plugin",
    exportName: "orgPlugin",
    label: "@ingot/org-plugin（组织管理）",
    available: true,
  },
  {
    id: "ingot-member",
    packageName: "@ingot/member-plugin",
    importPath: "@ingot/member-plugin",
    exportName: "memberPlugin",
    label: "@ingot/member-plugin（会员管理）",
    available: true,
  },
];

export const DEFAULT_OFFICIAL_PLUGIN_IDS = OFFICIAL_PLUGINS.map((plugin) => plugin.id);

export const toKebab = (value) =>
  String(value ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();

const copyDir = (from, to, replacements) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const destName = entry.name.replace(/__APP__/g, replacements.appCode);
    const dest = path.join(to, destName);
    if (entry.isDirectory()) {
      copyDir(src, dest, replacements);
      continue;
    }
    let content = fs.readFileSync(src, "utf8");
    for (const [token, value] of Object.entries(replacements)) {
      content = content.replaceAll(`{{${token}}}`, String(value));
    }
    fs.writeFileSync(dest, content);
  }
};

const renderPluginsTs = ({ official, withDemo }) => {
  const officialImports = official
    .map((plugin) => `import { ${plugin.exportName} } from "${plugin.importPath}";`)
    .join("\n");
  const officialIds = official.map((plugin) => plugin.exportName);
  const officialList = officialIds.join(", ");
  const demoImport = withDemo ? `import { createDemoMenus } from "./demoMenus";\n` : "";
  const localPush = withDemo
    ? `\n  plugins.push(createAppLocalPlugin(appCode, { staticMenus: createDemoMenus(appCode) }));`
    : `\n  plugins.push(createAppLocalPlugin(appCode));`;

  return `import type { InAdminPlugin } from "@ingot/admin-core";
${officialImports ? `${officialImports}\n` : ""}import { createAppLocalPlugin } from "./app-plugin";
${demoImport}
export const createAppPlugins = (appCode: string): InAdminPlugin[] => {
  const plugins: InAdminPlugin[] = [${officialList}];${localPush}
  return plugins;
};
`;
};

const ensureGitkeep = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
  const keep = path.join(dir, ".gitkeep");
  if (!fs.existsSync(keep) && fs.readdirSync(dir).filter((name) => name !== ".gitkeep").length === 0) {
    fs.writeFileSync(keep, "");
  }
};

const renderMainTs = ({ appCode }) => {
  return `import { bootstrapAdminApp, parseBoolean } from "@ingot/admin-core";
import type { InComponentSize } from "@ingot/admin-core";
import "@ingot/admin-core/style.css";
import { createAppPlugins } from "./plugins";

const env = import.meta.env;
const componentSize = (env.VITE_APP_SETTINGS_COMPONENT_SIZE || "default") as InComponentSize;
const appCode = env.VITE_APP_CODE || "${appCode}";

await bootstrapAdminApp({
  appCode,
  plugins: createAppPlugins(appCode),
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
`;
};

const patchPackageJson = (appDir, official) => {
  const pkgPath = path.join(appDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const selected = new Set(official.map((plugin) => plugin.packageName));
  for (const plugin of OFFICIAL_PLUGINS) {
    if (!selected.has(plugin.packageName)) {
      delete pkg.dependencies[plugin.packageName];
    } else {
      pkg.dependencies[plugin.packageName] = "workspace:*";
    }
  }
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
};

const patchOfficialPluginTypes = (appDir, official) => {
  const tsconfigPath = path.join(appDir, "tsconfig.app.json");
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
  const paths = { "@/*": ["./src/*"] };
  for (const plugin of official) {
    const shortName = plugin.packageName.replace("@ingot/", "");
    const fileName = `${shortName}.d.ts`;
    fs.writeFileSync(
      path.join(appDir, fileName),
      `import type { InAdminPlugin } from "@ingot/admin-core";\n\nexport declare const ${plugin.exportName}: InAdminPlugin;\n`,
    );
    paths[plugin.packageName] = [`./${fileName}`];
  }
  tsconfig.compilerOptions = tsconfig.compilerOptions ?? {};
  tsconfig.compilerOptions.paths = paths;
  fs.writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
};

const stripDemoSkeleton = (appDir) => {
  fs.rmSync(path.join(appDir, "src/pages/demo"), { recursive: true, force: true });
  fs.rmSync(path.join(appDir, "src/components"), { recursive: true, force: true });
  fs.rmSync(path.join(appDir, "src/directives"), { recursive: true, force: true });
  fs.rmSync(path.join(appDir, "src/stores"), { recursive: true, force: true });
  fs.rmSync(path.join(appDir, "src/demoMenus.ts"), { force: true });
  for (const relative of [
    "src/pages",
    "src/layouts",
    "src/components",
    "src/hooks",
    "src/directives",
    "src/stores",
  ]) {
    ensureGitkeep(path.join(appDir, relative));
  }
};

/**
 * @param {{
 *   appCode: string,
 *   port?: string | number,
 *   title?: string,
 *   officialPluginIds?: string[],
 *   withLocalPlugin?: boolean,
 *   rootDir?: string,
 * }} input
 */
export const scaffoldApp = (input) => {
  const rootDir = input.rootDir ?? REPO_ROOT;
  const appCode = toKebab(input.appCode);
  if (!appCode) {
    throw new Error("无效的 app 名称，需为 kebab-case（如 acme-admin）");
  }

  const port = String(input.port ?? "5800").trim() || "5800";
  if (!/^\d+$/.test(port)) {
    throw new Error("端口必须是数字");
  }

  const officialPluginIds = input.officialPluginIds ?? DEFAULT_OFFICIAL_PLUGIN_IDS;
  const official = [];
  for (const id of officialPluginIds) {
    const plugin = OFFICIAL_PLUGINS.find((item) => item.id === id);
    if (!plugin) {
      throw new Error(`未知官方插件: ${id}`);
    }
    if (!plugin.available) {
      throw new Error(`官方插件 “${plugin.label}” 尚不可用`);
    }
    official.push(plugin);
  }

  const withLocalPlugin = input.withLocalPlugin !== false;
  const appDir = path.join(rootDir, "apps", appCode);
  const appsRoot = path.join(rootDir, "apps");
  const resolvedApp = path.resolve(appDir);
  const resolvedApps = path.resolve(appsRoot);
  if (resolvedApp === resolvedApps || !resolvedApp.startsWith(`${resolvedApps}${path.sep}`)) {
    throw new Error("目标目录必须位于 apps/ 下");
  }
  if (fs.existsSync(appDir)) {
    throw new Error(`目录已存在，拒绝覆盖: ${appDir}`);
  }
  if (!fs.existsSync(TEMPLATE_DIR)) {
    throw new Error(`模板目录不存在: ${TEMPLATE_DIR}`);
  }

  const title = (input.title ?? appCode).trim() || appCode;
  const replacements = {
    appCode,
    appTitle: title,
    port,
    storePrefix: `__${appCode.replace(/-/g, "_")}__`,
    pluginId: `${appCode}-feature`,
    pageKeyPrefix: appCode.replace(/-/g, "."),
  };

  copyDir(TEMPLATE_DIR, appDir, replacements);
  fs.writeFileSync(path.join(appDir, "src/plugins.ts"), renderPluginsTs({ official, withDemo: withLocalPlugin }));
  fs.writeFileSync(path.join(appDir, "src/main.ts"), renderMainTs({ appCode }));
  patchPackageJson(appDir, official);
  patchOfficialPluginTypes(appDir, official);

  if (!withLocalPlugin) {
    stripDemoSkeleton(appDir);
  }

  return {
    appCode,
    appDir,
    port,
    officialPluginIds: official.map((plugin) => plugin.id),
    withLocalPlugin,
  };
};
