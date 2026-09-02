import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { ImportsMap } from "unplugin-auto-import/types";
import { searchForWorkspaceRoot } from "vite";
import type { Alias, Plugin, UserConfig } from "vite";

export const KNOWN_OFFICIAL_PLUGINS = [
  "@ingot/platform-plugin",
  "@ingot/security-plugin",
  "@ingot/org-plugin",
  "@ingot/member-plugin",
] as const;

export interface InOfficialPluginOption {
  /** workspace / npm 包名，如 `@ingot/platform-plugin` */
  packageName: string;
  /** 相对包根的源码目录，默认 `src` */
  srcDir?: string;
  /**
   * 额外源码别名（解析到该插件的 src）。
   * 官方业务插件不再提供 `@base`。
   */
  sourceAliases?: string[];
}

export interface InResolvedOfficialPlugin {
  packageName: string;
  rootDir: string;
  srcDir: string;
  sourceAliases: string[];
}

const readPackageJson = (rootDir: string): Record<string, unknown> => {
  const filePath = path.join(rootDir, "package.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
};

const hasPackageDep = (pkg: Record<string, unknown>, name: string): boolean => {
  const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;
  return sections.some((section) => {
    const deps = pkg[section] as Record<string, string> | undefined;
    return Boolean(deps?.[name]);
  });
};

const isWorkspaceRoot = (dir: string): boolean =>
  fs.existsSync(path.join(dir, "pnpm-workspace.yaml"));

const isPluginPackageRoot = (dir: string, packageName: string): boolean => {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath) || isWorkspaceRoot(dir)) {
    return false;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
    return pkg.name === packageName && fs.existsSync(path.join(dir, "src"));
  } catch {
    return false;
  }
};

/** 按 package.json name 扫描 plugins/*，目录名可以与包名不同。 */
const findPluginDirByPackageName = (
  pluginsDir: string,
  packageName: string,
): string | undefined => {
  if (!fs.existsSync(pluginsDir)) {
    return undefined;
  }
  for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = path.join(pluginsDir, entry.name);
    if (isPluginPackageRoot(candidate, packageName)) {
      return candidate;
    }
  }
  return undefined;
};

const resolvePackageRoot = (fromDir: string, packageName: string): string | undefined => {
  const directNm = path.join(fromDir, "node_modules", packageName);
  if (fs.existsSync(directNm)) {
    const real = fs.realpathSync(directNm);
    if (isPluginPackageRoot(real, packageName)) {
      return real;
    }
  }

  let dir = fromDir;
  for (let i = 0; i < 8; i += 1) {
    const pluginsDir = path.join(dir, "plugins");
    const scanned = findPluginDirByPackageName(pluginsDir, packageName);
    if (scanned) {
      return scanned;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  const candidates = [
    path.join(fromDir, "package.json"),
    path.join(fromDir, "node_modules", packageName, "package.json"),
  ];
  for (const from of candidates) {
    try {
      const pkgJson = createRequire(from).resolve(`${packageName}/package.json`);
      const resolved = fs.realpathSync(path.dirname(pkgJson));
      if (isPluginPackageRoot(resolved, packageName)) {
        return resolved;
      }
    } catch {
      // try next
    }
  }
  return undefined;
};

const normalizeOption = (
  option: string | InOfficialPluginOption,
): InOfficialPluginOption => (typeof option === "string" ? { packageName: option } : option);

const defaultSourceAliases = (): string[] => [];

/**
 * 解析当前 App 需要编译的官方源码插件根目录。
 * 未显式传入时：当前包自身若在已知清单中则包含；依赖了已知官方插件则包含。
 */
export const resolveOfficialPlugins = (
  rootDir: string,
  options?: Array<string | InOfficialPluginOption>,
): InResolvedOfficialPlugin[] => {
  const pkg = readPackageJson(rootDir);
  const packageName = String(pkg.name ?? "");
  const explicit = options?.map(normalizeOption);
  const requested: InOfficialPluginOption[] =
    explicit ??
    KNOWN_OFFICIAL_PLUGINS.filter(
      (name) => name === packageName || hasPackageDep(pkg, name),
    ).map((name) => ({ packageName: name }));

  const resolved: InResolvedOfficialPlugin[] = [];
  for (const option of requested) {
    const packageRoot =
      option.packageName === packageName
        ? rootDir
        : resolvePackageRoot(rootDir, option.packageName);
    if (!packageRoot) {
      throw new Error(
        `无法解析官方源码插件 “${option.packageName}”，请确认已在 package.json 中声明依赖`,
      );
    }
    resolved.push({
      packageName: option.packageName,
      rootDir: packageRoot,
      srcDir: path.resolve(packageRoot, option.srcDir ?? "src"),
      sourceAliases: option.sourceAliases ?? defaultSourceAliases(),
    });
  }
  return resolved;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripImporterQuery = (importer: string): string =>
  importer.replace(/\0/g, "").replace(/[?#].*$/, "");

const resolveImporterPath = (importer: string | undefined, rootDir: string): string | undefined => {
  if (!importer) {
    return undefined;
  }
  const stripped = stripImporterQuery(importer);
  return path.isAbsolute(stripped) ? stripped : path.resolve(rootDir, stripped);
};

const isFile = (filePath: string): boolean =>
  fs.existsSync(filePath) && fs.statSync(filePath).isFile();

const resolveSourceFile = (base: string): string | undefined => {
  if (path.extname(base) && isFile(base)) {
    return base;
  }
  const withExt = [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.vue`,
  ];
  const matchedFile = withExt.find((file) => isFile(file));
  if (matchedFile) {
    return matchedFile;
  }
  const indexFiles = [
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.mts"),
    path.join(base, "index.js"),
    path.join(base, "index.vue"),
  ];
  return indexFiles.find((file) => isFile(file));
};

const importerBelongsTo = (
  importer: string | undefined,
  plugin: InResolvedOfficialPlugin,
): boolean => {
  if (!importer) {
    return false;
  }
  const normalized = importer.replace(/\\/g, "/");
  const srcDir = plugin.srcDir.replace(/\\/g, "/");
  const rootDir = plugin.rootDir.replace(/\\/g, "/");
  return (
    normalized === srcDir ||
    normalized === rootDir ||
    normalized.startsWith(`${srcDir}/`) ||
    normalized.startsWith(`${rootDir}/`)
  );
};

/**
 * 官方插件包名到 plugin.ts 的 alias，以及仍声明的 sourceAliases。
 * `@/` 不在这里配置，改由 `createOfficialSourcePlugin` 按 importer 解析。
 * 不要加 customResolver：Vite 8 bundled 模式一旦出现 customResolver 会改走 JS alias，
 * 再被 Rolldown 把绝对路径收成错误的 `../../src`。
 */
export const createOfficialPluginAliasEntries = (plugins: InResolvedOfficialPlugin[]): Alias[] => {
  const entries: Alias[] = [];
  for (const plugin of plugins) {
    const pluginEntry = path.resolve(plugin.srcDir, "plugin.ts");
    entries.push({
      find: plugin.packageName,
      replacement: pluginEntry,
    });
    for (const sourceAlias of plugin.sourceAliases) {
      entries.push({
        find: new RegExp(`^${escapeRegExp(sourceAlias)}(?=/|$)`),
        replacement: plugin.srcDir.replace(/\/$/, ""),
      });
    }
  }

  return entries;
};

/**
 * 让组合方 Vite 能编译官方源码插件内的 Vue SFC / `import.meta.glob`：
 * - 按 importer 把 `@/` 指回该官方插件的 src（避免与宿主 `@` 冲突）
 * - 宿主 importer 的 `@/` 落回宿主 src
 * - 仅对仍声明 `sourceAliases` 的插件解析 `@base` 等兼容别名
 * - `server.fs.allow` 放行官方插件目录
 * - 排除预构建，避免把 Vue SFC 打进 optimizeDeps
 *
 * `@/` 必须在此插件中解析，不能做成 Rolldown 原生 alias：原生 alias 不分 importer，
 * 会把业务插件的 `@/` 错误地指到宿主 src。
 */
export const createOfficialSourcePlugin = (
  plugins: InResolvedOfficialPlugin[],
  rootDir: string,
  hostSrcDir = path.resolve(rootDir, "src"),
): Plugin => {
  const resolvedHostSrc = hostSrcDir.replace(/\/$/, "");
  return {
    name: "ingot-official-source-plugins",
    enforce: "pre",
    resolveId(id, importer) {
      const absImporter = resolveImporterPath(importer, rootDir);
      for (const plugin of plugins) {
        if (id === plugin.packageName) {
          return path.resolve(plugin.srcDir, "plugin.ts");
        }
        for (const alias of plugin.sourceAliases) {
          if (id === alias) {
            return path.resolve(plugin.srcDir);
          }
          const prefix = `${alias}/`;
          if (id.startsWith(prefix)) {
            return path.resolve(plugin.srcDir, id.slice(prefix.length));
          }
        }
      }

      if (id === "@" || id.startsWith("@/")) {
        const owner = absImporter
          ? plugins.find((plugin) => importerBelongsTo(absImporter, plugin))
          : undefined;
        const rest = id === "@" ? "" : id.slice(2);
        const target = path.resolve(
          (owner?.srcDir ?? resolvedHostSrc).replace(/\/$/, ""),
          rest,
        );
        return resolveSourceFile(target);
      }
      return undefined;
    },
    config(): UserConfig {
      return {
        resolve: {
          dedupe: ["vue", "vue-router", "pinia", "element-plus", "@vue/shared", "@vueuse/core"],
        },
        optimizeDeps: {
          exclude: plugins.map((plugin) => plugin.packageName),
        },
        server: {
          fs: {
            allow: [
              searchForWorkspaceRoot(rootDir),
              rootDir,
              ...plugins.map((plugin) => plugin.rootDir),
            ],
          },
        },
      };
    },
  };
};

export const ADMIN_CORE_AUTO_IMPORTS: ImportsMap = {
  "@ingot/admin-core": [
    "useEnum",
    "useGo",
    "useMessage",
    "useMessageConfirm",
    "usePaging",
    "usePermissions",
    "useUserInfoStore",
    "useAppStore",
    "useConfirmDelete",
    "useConfirmStatus",
    "useConfirmStatus2",
    "useConfirmUpdate",
    "transformPageAPI",
    "transformDeleteAPI",
    "transformUpdateAPI",
  ],
};
