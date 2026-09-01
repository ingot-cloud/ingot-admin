import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { ImportsMap } from "unplugin-auto-import/types";
import { searchForWorkspaceRoot } from "vite";
import type { Alias, Plugin, UserConfig } from "vite";

const KNOWN_OFFICIAL_APPS = ["@ingot/admin-app"] as const;

export interface InOfficialAppPluginOption {
  /** workspace / npm 包名，如 `@ingot/admin-app` */
  packageName: string;
  /** 相对包根的源码目录，默认 `src` */
  srcDir?: string;
  /**
   * 额外源码别名（解析到该 App 的 src）。
   * `@ingot/admin-app` 默认包含 `@base`，兼容从 admin-base 回迁的 import。
   */
  sourceAliases?: string[];
}

export interface InResolvedOfficialApp {
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

const isAppPackageRoot = (dir: string, packageName: string): boolean => {
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

/** 按 package.json name 扫描 apps/*，目录名可以与包名不同（如 `admin` vs `@ingot/admin-app`）。 */
const findAppDirByPackageName = (appsDir: string, packageName: string): string | undefined => {
  if (!fs.existsSync(appsDir)) {
    return undefined;
  }
  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = path.join(appsDir, entry.name);
    if (isAppPackageRoot(candidate, packageName)) {
      return candidate;
    }
  }
  return undefined;
};

const resolvePackageRoot = (fromDir: string, packageName: string): string | undefined => {
  const directNm = path.join(fromDir, "node_modules", packageName);
  if (fs.existsSync(directNm)) {
    const real = fs.realpathSync(directNm);
    if (isAppPackageRoot(real, packageName)) {
      return real;
    }
  }

  let dir = fromDir;
  for (let i = 0; i < 8; i += 1) {
    const appsDir = path.join(dir, "apps");
    const scanned = findAppDirByPackageName(appsDir, packageName);
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
      if (isAppPackageRoot(resolved, packageName)) {
        return resolved;
      }
    } catch {
      // try next
    }
  }
  return undefined;
};

const normalizeOption = (
  option: string | InOfficialAppPluginOption,
): InOfficialAppPluginOption =>
  typeof option === "string" ? { packageName: option } : option;

const defaultSourceAliases = (packageName: string): string[] => {
  if (packageName === "@ingot/admin-app") {
    return ["@base"];
  }
  return [];
};

/**
 * 解析当前 App 需要编译的官方 App 插件根目录。
 * 未显式传入时：当前包自身若在已知清单中则包含；依赖了已知官方 App 则包含。
 */
export const resolveOfficialApps = (
  rootDir: string,
  options?: Array<string | InOfficialAppPluginOption>,
): InResolvedOfficialApp[] => {
  const pkg = readPackageJson(rootDir);
  const packageName = String(pkg.name ?? "");
  const explicit = options?.map(normalizeOption);
  const requested: InOfficialAppPluginOption[] =
    explicit ??
    KNOWN_OFFICIAL_APPS.filter(
      (name) => name === packageName || hasPackageDep(pkg, name),
    ).map((name) => ({ packageName: name }));

  const resolved: InResolvedOfficialApp[] = [];
  for (const option of requested) {
    const packageRoot =
      option.packageName === packageName
        ? rootDir
        : resolvePackageRoot(rootDir, option.packageName);
    if (!packageRoot) {
      throw new Error(
        `无法解析官方 App 插件 “${option.packageName}”，请确认已在 package.json 中声明依赖`,
      );
    }
    resolved.push({
      packageName: option.packageName,
      rootDir: packageRoot,
      srcDir: path.resolve(packageRoot, option.srcDir ?? "src"),
      sourceAliases: option.sourceAliases ?? defaultSourceAliases(option.packageName),
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

const importerBelongsTo = (importer: string | undefined, app: InResolvedOfficialApp): boolean => {
  if (!importer) {
    return false;
  }
  const normalized = importer.replace(/\\/g, "/");
  const srcDir = app.srcDir.replace(/\\/g, "/");
  const rootDir = app.rootDir.replace(/\\/g, "/");
  return (
    normalized === srcDir ||
    normalized === rootDir ||
    normalized.startsWith(`${srcDir}/`) ||
    normalized.startsWith(`${rootDir}/`)
  );
};

/**
 * 官方 App 源码别名。使用正则，避免字符串 `@` 前缀匹配抢走 `@base`。
 * 不要加 customResolver：Vite 8 bundled 模式一旦出现 customResolver 会改走 JS alias，
 * 再被 Rolldown 把绝对路径收成错误的 `../../src`。
 */
export const createOfficialAppAliasEntries = (
  apps: InResolvedOfficialApp[],
  hostSrcDir: string,
): Alias[] => {
  const entries: Alias[] = [];
  for (const app of apps) {
    const pluginEntry = path.resolve(app.srcDir, "plugin.ts");
    entries.push({
      find: `${app.packageName}/plugin`,
      replacement: pluginEntry,
    });
    entries.push({
      find: app.packageName,
      replacement: pluginEntry,
    });
    for (const sourceAlias of app.sourceAliases) {
      entries.push({
        find: new RegExp(`^${escapeRegExp(sourceAlias)}(?=/|$)`),
        replacement: app.srcDir.replace(/\/$/, ""),
      });
    }
  }

  entries.push({
    find: /^@\//,
    replacement: `${hostSrcDir.replace(/\/$/, "")}/`,
  });

  return entries;
};

/**
 * 让组合方 Vite 能编译官方 App 插件内的 Vue SFC / `import.meta.glob`：
 * - 按 importer 把 `@/` 指回该官方 App 的 src（避免与宿主 `@` 冲突）
   * - 解析 `@base` 等到 admin/src
 * - `server.fs.allow` 放行官方 App 目录
 * - 排除预构建，避免把 Vue SFC 打进 optimizeDeps
 */
export const createOfficialAppVitePlugin = (
  apps: InResolvedOfficialApp[],
  rootDir: string,
): Plugin => ({
  name: "ingot-official-app-plugins",
  enforce: "pre",
  resolveId(id, importer) {
    const absImporter = resolveImporterPath(importer, rootDir);
    for (const app of apps) {
      if (id === app.packageName || id === `${app.packageName}/plugin`) {
        return path.resolve(app.srcDir, "plugin.ts");
      }
      for (const alias of app.sourceAliases) {
        if (id === alias) {
          return path.resolve(app.srcDir);
        }
        const prefix = `${alias}/`;
        if (id.startsWith(prefix)) {
          return path.resolve(app.srcDir, id.slice(prefix.length));
        }
      }
    }

    if ((id === "@" || id.startsWith("@/")) && absImporter) {
      const owner = apps.find((app) => importerBelongsTo(absImporter, app));
      if (owner) {
        const rest = id === "@" ? "" : id.slice(2);
        return path.resolve(owner.srcDir, rest);
      }
    }
    return undefined;
  },
  config(): UserConfig {
    return {
      resolve: {
        dedupe: ["vue", "vue-router", "pinia", "element-plus", "@vue/shared", "@vueuse/core"],
      },
      optimizeDeps: {
        exclude: apps.map((app) => app.packageName),
      },
      server: {
        fs: {
          allow: [searchForWorkspaceRoot(rootDir), rootDir, ...apps.map((app) => app.rootDir)],
        },
      },
    };
  },
});

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
