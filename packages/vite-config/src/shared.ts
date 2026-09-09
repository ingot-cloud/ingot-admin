import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import postcssNesting from "postcss-nesting";
import Unocss from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Icons from "unplugin-icons/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import IconsResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import type { Alias, AliasOptions, PluginOption, UserConfig } from "vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import vueDevTools from "vite-plugin-vue-devtools";
import { createAppConventionGuard } from "./app-conventions.js";
import {
  createOfficialPluginAliasEntries,
  createOfficialSourcePlugin,
  resolveAdminCoreAutoImportMaps,
  resolveOfficialPlugins,
} from "./official-plugins.js";
import type { InViteBaseOptions } from "./types.js";
import { createUnoContentFilesystem } from "./uno-content.js";
import { createIconifyOfflinePlugin } from "./iconify-offline.js";

const DEFAULT_APP_HOOK_DIRS = ["./src/hooks/**", "./src/stores/**"];

/**
 * 管理台按源码编译 admin-core 时，宿主 AutoImport 默认只扫 App 自己的 hooks/stores。
 * Vue/Pinia 预设仍会注入，但自定义 composable 不会；漏写 import 就会在运行时变成 is not defined。
 * 这里补扫 admin-core 源码目录，作为漏网保护。admin-core 内部仍应显式 import，避免从
 * `@ingot/admin-core` 再导入自己。仅在宿主确实依赖 admin-core 时传入路径，
 * 避免登录应用扫到同名 `useGlobalLoading`。
 */
export const resolveAdminCoreSourceAutoImportDirs = (adminCoreSrc: string | undefined): string[] => {
  if (!adminCoreSrc) {
    return [];
  }
  const src = adminCoreSrc.replace(/\\/g, "/");
  return [`${src}/hooks/**`, `${src}/stores/**`];
};

/**
 * 同源码模式：宿主 Components 默认只扫 App 自己的组件目录。
 * 布局壳层（InAppBar / InMenu 等）原先只靠 admin-core 自己的自动导入，
 * 管理台按源码编译这些 SFC 时会 Failed to resolve component。
 */
export const resolveAdminCoreSourceComponentDirs = (adminCoreSrc: string | undefined): string[] => {
  if (!adminCoreSrc) {
    return [];
  }
  const src = adminCoreSrc.replace(/\\/g, "/");
  return [`${src}/components`, `${src}/layouts/widgets`];
};

export interface InSharedViteConfigResult {
  plugins: PluginOption[];
  config: UserConfig;
}

/**
 * 解析 crypto-js 单文件入口的绝对路径。
 * Vite 8 / Rolldown 预构建模块化 index.js 时会拆坏命名导出（如 export named 't'）。
 */
const resolveCryptoJsBundle = (rootDir: string): string | undefined => {
  const candidates = [
    path.join(rootDir, "package.json"),
    path.join(rootDir, "node_modules/@ingot/shared/package.json"),
    path.join(rootDir, "node_modules/@ingot/admin-core/package.json"),
  ];
  for (const from of candidates) {
    try {
      return createRequire(from).resolve("crypto-js/crypto-js.js");
    } catch {
      // try next
    }
  }
  return undefined;
};

const resolveWorkspacePackageSrc = (rootDir: string, packageDir: string): string | undefined => {
  const packageSrc = path.resolve(rootDir, `../../packages/${packageDir}/src`);
  if (fs.existsSync(path.join(packageSrc, "index.ts"))) {
    return packageSrc;
  }
  return undefined;
};

const resolveWorkspaceSharedSrc = (rootDir: string): string | undefined =>
  resolveWorkspacePackageSrc(rootDir, "shared");

const resolveWorkspaceHttpClientSrc = (rootDir: string): string | undefined =>
  resolveWorkspacePackageSrc(rootDir, "http-client");

const flattenAliases = (aliases?: AliasOptions): Alias[] => {
  if (!aliases) {
    return [];
  }
  if (Array.isArray(aliases)) {
    return aliases;
  }
  return Object.entries(aliases).map(([find, replacement]) => ({
    find,
    replacement: replacement as string,
  }));
};

const isHostAtAlias = (find: Alias["find"]): boolean => find === "@" || find === "@/";

const hasAdminCoreDep = (rootDir: string): boolean => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Boolean(
      pkg.dependencies?.["@ingot/admin-core"] || pkg.devDependencies?.["@ingot/admin-core"],
    );
  } catch {
    return false;
  }
};

export const createSharedViteConfig = (
  options: InViteBaseOptions,
  symbol: string,
): InSharedViteConfigResult => {
  const iconDir = options.iconDir ?? "src/assets/icons";
  const absoluteIconDir = path.resolve(options.rootDir, iconDir);
  const cryptoJsBundle = resolveCryptoJsBundle(options.rootDir);
  const officialPlugins = resolveOfficialPlugins(options.rootDir, options.officialPlugins);
  const sharedSrc = resolveWorkspaceSharedSrc(options.rootDir);
  const httpClientSrc = resolveWorkspaceHttpClientSrc(options.rootDir);
  const adminCoreSrc = resolveWorkspacePackageSrc(options.rootDir, "admin-core");
  const hostAliases = flattenAliases(options.aliases);
  const hostAt = hostAliases.find((alias) => isHostAtAlias(alias.find));
  const hostSrcDir =
    hostAt && typeof hostAt.replacement === "string"
      ? hostAt.replacement.replace(/\/$/, "")
      : path.resolve(options.rootDir, "src");
  const plugins: PluginOption[] = [vue(), vueJsx()];

  plugins.push(
    createOfficialSourcePlugin(
      officialPlugins,
      options.rootDir,
      hostSrcDir,
      adminCoreSrc ? [adminCoreSrc] : [],
    ),
  );

  if (options.enableDevTools !== false) {
    plugins.push(vueDevTools());
  }

  plugins.push(
    createSvgIconsPlugin({
      iconDirs: [absoluteIconDir],
      symbolId: `${symbol}-[dir]-[name]`,
    }),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "@vueuse/core",
        "pinia",
        ...resolveAdminCoreAutoImportMaps(hasAdminCoreDep(options.rootDir), adminCoreSrc),
        ...(options.autoImports ? [options.autoImports] : []),
      ],
      dirs: [
        ...(options.hookDirs ?? DEFAULT_APP_HOOK_DIRS),
        ...resolveAdminCoreSourceAutoImportDirs(hasAdminCoreDep(options.rootDir) ? adminCoreSrc : undefined),
      ],
      dts: "./auto-imports.d.ts",
      vueTemplate: true,
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dts: "./components.d.ts",
      dtsTsx: false,
      dirs: [
        ...(options.componentDirs ?? ["./src/components", "./src/layouts/widgets"]),
        ...resolveAdminCoreSourceComponentDirs(hasAdminCoreDep(options.rootDir) ? adminCoreSrc : undefined),
      ],
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: "i",
          customCollections: [symbol],
        }),
      ],
    }),
    Icons({
      autoInstall: false,
      compiler: "vue3",
      defaultClass: "inline",
      customCollections: {
        [symbol]: FileSystemIconLoader(absoluteIconDir),
      },
    }),
    Unocss({
      content: {
        filesystem: createUnoContentFilesystem(options.rootDir, officialPlugins),
      },
    }),
    createIconifyOfflinePlugin({
      rootDir: options.rootDir,
      extra: options.iconifyOffline?.extra,
      collections: options.iconifyOffline?.collections,
      scan: options.iconifyOffline?.scan,
      usedFile: options.iconifyOffline?.usedFile,
      scanDirs: [
        path.join(options.rootDir, "src"),
        ...officialPlugins.map((plugin) => plugin.srcDir),
        ...(adminCoreSrc ? [adminCoreSrc] : []),
      ],
      packageDirs: [
        options.rootDir,
        ...officialPlugins.map((plugin) => plugin.rootDir),
        ...(adminCoreSrc ? [path.dirname(adminCoreSrc)] : []),
      ],
      externalizeOnBuild: options.externalizeIconifyOffline,
    }),
    ...(options.enforceAppConventions
      ? [
          createAppConventionGuard({
            rootDir: options.rootDir,
            componentDirs: options.componentDirs ?? ["./src/components"],
            scriptDirs: options.hookDirs ?? DEFAULT_APP_HOOK_DIRS,
          }),
        ]
      : []),
    ...(options.extraPlugins ?? []),
  );

  return {
    plugins,
    config: {
      legacy: {
        inconsistentCjsInterop: true,
      },
      optimizeDeps: {
        // 强制预构建单文件入口，避免模块化 index.js 被 Rolldown 拆坏
        include: cryptoJsBundle ? [cryptoJsBundle] : ["crypto-js"],
      },
      resolve: {
        alias: [
          ...createOfficialPluginAliasEntries(officialPlugins),
          ...(sharedSrc
            ? ([
                {
                  find: "@ingot/shared/crypto",
                  replacement: path.join(sharedSrc, "crypto/index.ts"),
                },
                {
                  find: "@ingot/shared/hooks",
                  replacement: path.join(sharedSrc, "hooks/index.ts"),
                },
                { find: "@ingot/shared", replacement: path.join(sharedSrc, "index.ts") },
              ] satisfies Alias[])
            : []),
          ...(httpClientSrc
            ? ([{ find: "@ingot/http-client", replacement: path.join(httpClientSrc, "index.ts") }] satisfies Alias[])
            : []),
          ...(adminCoreSrc
            ? ([
                {
                  find: "@ingot/admin-core/style.css",
                  replacement: path.join(adminCoreSrc, "styles/index.ts"),
                },
                {
                  find: /^@ingot\/admin-core$/,
                  replacement: path.join(adminCoreSrc, "index.ts"),
                },
              ] satisfies Alias[])
            : []),
          ...hostAliases.filter((alias) => !isHostAtAlias(alias.find)),
          ...(cryptoJsBundle
            ? ([{ find: "crypto-js", replacement: cryptoJsBundle }] satisfies Alias[])
            : []),
        ],
      },
      css: {
        postcss: {
          plugins: [postcssNesting],
        },
      },
    },
  };
};
