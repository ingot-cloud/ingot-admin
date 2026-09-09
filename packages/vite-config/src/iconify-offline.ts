import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { IconifyJSON } from "@iconify/types";
import { getIcons } from "@iconify/utils";
import type { Plugin } from "vite";
import {
  createUsedIconWriter,
  DEFAULT_USED_FILE,
  handleUsedIconRequest,
  ICONIFY_USED_ENDPOINT,
  readUsedIconFile,
  usedFileToCollections,
  usedIconNames,
} from "./iconify-used.js";

export const ICONIFY_OFFLINE_ID = "virtual:iconify-offline";
export const ICONIFY_ICON_ID = "virtual:ingot-iconify-icon";
const RESOLVED_ICONIFY_OFFLINE_ID = `\0${ICONIFY_OFFLINE_ID}`;
const RESOLVED_ICONIFY_ICON_ID = `\0${ICONIFY_ICON_ID}`;

const SCAN_EXTENSIONS = new Set([".vue", ".ts", ".tsx", ".js", ".jsx"]);
const SKIP_DIRECTORIES = new Set(["node_modules", "dist", "coverage", ".git"]);
const QUOTED_ICON_RE =
  /(["'`])([a-z][a-z0-9]*(?:-[a-z0-9]+)*):([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)\1/g;
const FULL_COLLECTION_WARN_BYTES = 400 * 1024;

export interface InIconifyOfflineOptions {
  /** 源码扫描不到、但运行时会出现的图标，如后端菜单 */
  extra?: string[];
  /** 整包打进产物的集合前缀。体积大的集合（mdi 等）不要整包 */
  collections?: string[];
  /** 是否扫描源码，默认 true */
  scan?: boolean;
  /**
   * 开发预览写入、构建读取的 SVG 收集文件，相对 App 根目录。
   * 默认 `iconify-offline.used.json`。
   */
  usedFile?: string;
}

export interface IconifyOfflinePluginOptions extends InIconifyOfflineOptions {
  rootDir: string;
  scanDirs: string[];
  packageDirs: string[];
  /**
   * 组件库 production build 不解析虚拟模块，把 import 留给 App 注入完整集合。
   * Vitest（command=serve）仍启用插件。
   */
  externalizeOnBuild?: boolean;
}

export interface ParsedIconName {
  prefix: string;
  name: string;
}

export const parseQuotedIconNames = (source: string): ParsedIconName[] => {
  const result: ParsedIconName[] = [];
  QUOTED_ICON_RE.lastIndex = 0;
  for (const match of source.matchAll(QUOTED_ICON_RE)) {
    const prefix = match[2];
    const name = match[3];
    if (!prefix || !name) {
      continue;
    }
    result.push({ prefix, name });
  }
  return result;
};

export const parseIconNameList = (values: string[] | undefined): ParsedIconName[] => {
  if (!values) {
    return [];
  }
  const result: ParsedIconName[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const separator = trimmed.indexOf(":");
    if (separator <= 0 || separator === trimmed.length - 1) {
      continue;
    }
    result.push({
      prefix: trimmed.slice(0, separator),
      name: trimmed.slice(separator + 1),
    });
  }
  return result;
};

const shouldSkipFile = (fileName: string): boolean =>
  /\.(?:test|spec)\./.test(fileName) || fileName.endsWith(".d.ts");

export const listSourceFiles = (dirs: string[]): string[] => {
  const files: string[] = [];
  const visit = (dir: string): void => {
    if (!fs.existsSync(dir)) {
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name) || entry.name === "__fixtures__") {
          continue;
        }
        visit(fullPath);
        continue;
      }
      if (shouldSkipFile(entry.name)) {
        continue;
      }
      if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  };
  for (const dir of dirs) {
    visit(dir);
  }
  return files;
};

export const filterIconsByPrefixes = (
  icons: ParsedIconName[],
  prefixes: Set<string>,
): ParsedIconName[] => icons.filter((icon) => prefixes.has(icon.prefix));

export const collectIconNamesFromFiles = (files: string[]): ParsedIconName[] => {
  const result: ParsedIconName[] = [];
  for (const file of files) {
    let source: string;
    try {
      source = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    result.push(...parseQuotedIconNames(source));
  }
  return result;
};

export const listDeclaredIconifyPrefixes = (packageDirs: string[]): string[] => {
  const prefixes = new Set<string>();
  for (const dir of packageDirs) {
    const pkgPath = path.join(dir, "package.json");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const name of Object.keys(deps)) {
        if (name.startsWith("@iconify-json/")) {
          prefixes.add(name.slice("@iconify-json/".length));
        }
      }
    } catch {
      // skip invalid package.json
    }
  }
  return [...prefixes].sort();
};

const resolveIconsJson = (packageDirs: string[], prefix: string): string | undefined => {
  for (const dir of packageDirs) {
    const pkgJson = path.join(dir, "package.json");
    if (!fs.existsSync(pkgJson)) {
      continue;
    }
    try {
      return createRequire(pkgJson).resolve(`@iconify-json/${prefix}/icons.json`);
    } catch {
      // try next package root
    }
  }
  return undefined;
};

const readIconifyJson = (filePath: string): IconifyJSON | undefined => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as IconifyJSON;
  } catch {
    return undefined;
  }
};

export interface BuildOfflineIconDataResult {
  collections: IconifyJSON[];
  missingPrefixes: string[];
  missingIcons: string[];
  largeCollections: string[];
}

const addToPrefixMap = (
  target: Map<string, Set<string>>,
  icons: ParsedIconName[],
): void => {
  for (const icon of icons) {
    const names = target.get(icon.prefix) ?? new Set<string>();
    names.add(icon.name);
    target.set(icon.prefix, names);
  }
};

export const buildOfflineIconData = (options: {
  scanIcons: ParsedIconName[];
  extraIcons: ParsedIconName[];
  fullCollections: string[];
  packageDirs: string[];
}): BuildOfflineIconDataResult => {
  const missingPrefixes = new Set<string>();
  const missingIcons: string[] = [];
  const largeCollections: string[] = [];
  const collections: IconifyJSON[] = [];
  const selected = new Map<string, Set<string>>();
  addToPrefixMap(selected, options.scanIcons);
  addToPrefixMap(selected, options.extraIcons);

  const full = new Set(options.fullCollections);
  for (const prefix of full) {
    selected.delete(prefix);
    const jsonPath = resolveIconsJson(options.packageDirs, prefix);
    if (!jsonPath) {
      missingPrefixes.add(prefix);
      continue;
    }
    const json = readIconifyJson(jsonPath);
    if (!json) {
      missingPrefixes.add(prefix);
      continue;
    }
    try {
      if (fs.statSync(jsonPath).size > FULL_COLLECTION_WARN_BYTES) {
        largeCollections.push(prefix);
      }
    } catch {
      // ignore stat errors
    }
    collections.push(json);
  }

  for (const [prefix, names] of selected) {
    const jsonPath = resolveIconsJson(options.packageDirs, prefix);
    if (!jsonPath) {
      missingPrefixes.add(prefix);
      continue;
    }
    const json = readIconifyJson(jsonPath);
    if (!json) {
      missingPrefixes.add(prefix);
      continue;
    }
    const extracted = getIcons(json, [...names], true);
    if (!extracted) {
      for (const name of names) {
        missingIcons.push(`${prefix}:${name}`);
      }
      continue;
    }
    const { not_found: missingInSet = [], ...rest } = extracted;
    for (const name of missingInSet) {
      missingIcons.push(`${prefix}:${name}`);
    }
    if (Object.keys(rest.icons ?? {}).length > 0 || Object.keys(rest.aliases ?? {}).length > 0) {
      collections.push(rest);
    }
  }

  return {
    collections,
    missingPrefixes: [...missingPrefixes].sort(),
    missingIcons: [...new Set(missingIcons)].sort(),
    largeCollections: [...new Set(largeCollections)].sort(),
  };
};

export const generateOfflineModule = (collections: IconifyJSON[]): string => {
  const statements = collections.map(
    (collection) => `addCollection(${JSON.stringify(collection)});`,
  );
  return `import { addCollection } from "@iconify/vue/offline";\n${statements.join("\n")}\n`;
};

export const generateIconModule = (isBuild: boolean): string => {
  if (isBuild) {
    return `import "${ICONIFY_OFFLINE_ID}";
export { Icon } from "@iconify/vue/offline";
export const loadIcon = () => Promise.resolve(null);
export const getIcon = () => null;
`;
  }
  return `export { Icon, loadIcon, getIcon } from "@iconify/vue";
`;
};

const uniqueSortedDirs = (dirs: string[]): string[] =>
  [...new Set(dirs.map((dir) => path.resolve(dir)))].filter((dir) => fs.existsSync(dir));

const requestPath = (url: string | undefined): string => (url ?? "").split("?")[0] ?? "";

export const createIconifyOfflinePlugin = (options: IconifyOfflinePluginOptions): Plugin => {
  const scanEnabled = options.scan !== false;
  const scanDirs = uniqueSortedDirs(options.scanDirs);
  const packageDirs = uniqueSortedDirs(options.packageDirs);
  const usedFilePath = path.resolve(options.rootDir, options.usedFile ?? DEFAULT_USED_FILE);
  let cachedModule: string | undefined;
  let isBuild = false;
  const usedWriter = createUsedIconWriter(usedFilePath);

  const buildModule = (warn: (message: string) => void): string => {
    const used = readUsedIconFile(usedFilePath);
    const recorded = usedIconNames(used);
    const declared = new Set(listDeclaredIconifyPrefixes(packageDirs));
    const scanIcons = scanEnabled
      ? filterIconsByPrefixes(
          collectIconNamesFromFiles(listSourceFiles(scanDirs)),
          declared,
        ).filter((icon) => !recorded.has(`${icon.prefix}:${icon.name}`))
      : [];
    const extraIcons = parseIconNameList(options.extra).filter(
      (icon) => !recorded.has(`${icon.prefix}:${icon.name}`),
    );
    const data = buildOfflineIconData({
      scanIcons,
      extraIcons,
      fullCollections: options.collections ?? [],
      packageDirs,
    });

    for (const prefix of data.missingPrefixes) {
      warn(`未找到本地图标集 @iconify-json/${prefix}，内网将无法显示该前缀图标`);
    }
    for (const icon of data.missingIcons) {
      warn(`本地图标集中不存在 ${icon}`);
    }
    for (const prefix of data.largeCollections) {
      warn(`iconifyOffline.collections 整包打入 ${prefix}，体积较大，请确认是否必要`);
    }

    return generateOfflineModule([...usedFileToCollections(used), ...data.collections]);
  };

  return {
    name: "ingot-iconify-offline",
    enforce: "pre",
    apply(_config, { command }) {
      if (options.externalizeOnBuild && command === "build") {
        return false;
      }
      return true;
    },
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      if (id === ICONIFY_OFFLINE_ID) {
        return RESOLVED_ICONIFY_OFFLINE_ID;
      }
      if (id === ICONIFY_ICON_ID) {
        return RESOLVED_ICONIFY_ICON_ID;
      }
      return undefined;
    },
    load(id) {
      if (id === RESOLVED_ICONIFY_ICON_ID) {
        return generateIconModule(isBuild);
      }
      if (id !== RESOLVED_ICONIFY_OFFLINE_ID) {
        return undefined;
      }
      if (!cachedModule) {
        cachedModule = buildModule((message) => {
          this.warn(message);
        });
      }
      return cachedModule;
    },
    configureServer(server) {
      for (const dir of scanDirs) {
        server.watcher.add(dir);
      }
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || requestPath(req.url) !== ICONIFY_USED_ENDPOINT) {
          next();
          return;
        }
        void handleUsedIconRequest(req, res, usedWriter);
      });
      const invalidate = (file: string): void => {
        const normalized = file.replace(/\\/g, "/");
        const hit = scanDirs.some((dir) => normalized.startsWith(dir.replace(/\\/g, "/")));
        if (!hit) {
          return;
        }
        cachedModule = undefined;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ICONIFY_OFFLINE_ID);
        if (mod) {
          void server.reloadModule(mod);
        }
      };
      server.watcher.on("change", invalidate);
      server.watcher.on("add", invalidate);
    },
  };
};
