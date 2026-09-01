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
import {
  ADMIN_CORE_AUTO_IMPORTS,
  createOfficialAppAliasEntries,
  createOfficialAppVitePlugin,
  resolveOfficialApps,
} from "./official-apps.js";
import type { InViteBaseOptions } from "./types.js";

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

const resolveWorkspaceSharedSrc = (rootDir: string): string | undefined => {
  const sharedSrc = path.resolve(rootDir, "../../packages/shared/src");
  if (fs.existsSync(path.join(sharedSrc, "index.ts"))) {
    return sharedSrc;
  }
  return undefined;
};

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
  const officialApps = resolveOfficialApps(options.rootDir, options.officialAppPlugins);
  const sharedSrc = resolveWorkspaceSharedSrc(options.rootDir);
  const hostAliases = flattenAliases(options.aliases);
  const hostAt = hostAliases.find((alias) => isHostAtAlias(alias.find));
  const hostSrcDir =
    hostAt && typeof hostAt.replacement === "string"
      ? hostAt.replacement.replace(/\/$/, "")
      : path.resolve(options.rootDir, "src");
  const plugins: PluginOption[] = [vue(), vueJsx()];

  if (officialApps.length > 0) {
    plugins.push(createOfficialAppVitePlugin(officialApps, options.rootDir));
  }

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
        ...(hasAdminCoreDep(options.rootDir) ? [ADMIN_CORE_AUTO_IMPORTS] : []),
        ...(options.autoImports ? [options.autoImports] : []),
      ],
      dirs: options.hookDirs ?? ["./src/hooks/**"],
      dts: "./auto-imports.d.ts",
      vueTemplate: true,
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dts: "./components.d.ts",
      dtsTsx: false,
      dirs: options.componentDirs ?? ["./src/components", "./src/layouts"],
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: "i",
          customCollections: [symbol],
        }),
      ],
    }),
    Icons({
      autoInstall: true,
      compiler: "vue3",
      defaultClass: "inline",
      customCollections: {
        [symbol]: FileSystemIconLoader(absoluteIconDir),
      },
    }),
    Unocss(),
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
          ...createOfficialAppAliasEntries(officialApps, hostSrcDir),
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
