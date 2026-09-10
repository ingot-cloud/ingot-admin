import fs from "node:fs";
import path from "node:path";
import { DEFAULT_THEME, OFFICIAL_PLUGINS } from "./constants.mjs";
import { isJsIdentifier } from "./identifiers.mjs";

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const listPackageDirs = (rootDir, folder) => {
  const dir = path.join(rootDir, folder);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(dir, entry.name));
};

const exportBlock = (pkg, key = ".") => {
  const exportsField = pkg.exports;
  if (!exportsField || typeof exportsField !== "object") {
    return pkg.types || pkg.main || pkg.module;
  }
  const entry = exportsField[key] ?? exportsField["."];
  if (typeof entry === "string") {
    return entry;
  }
  if (entry && typeof entry === "object") {
    return entry.types || entry.import || entry.default;
  }
  return undefined;
};

const collectExportNames = (source) => {
  const names = new Set();
  const patterns = [
    /export\s+const\s+([A-Za-z_$][\w$]*)/g,
    /export\s+\{\s*([^}]+)\}/g,
    /export\s+function\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (pattern.source.includes("{")) {
        for (const part of match[1].split(",")) {
          const cleaned = part.replace(/^type\s+/, "").trim();
          const alias = cleaned.split(/\s+as\s+/);
          const name = (alias[1] ?? alias[0]).trim();
          if (name && isJsIdentifier(name)) {
            names.add(name);
          }
        }
      } else if (isJsIdentifier(match[1])) {
        names.add(match[1]);
      }
    }
  }
  return [...names];
};

const readEntrySource = (pkgDir, pkg) => {
  const relative = exportBlock(pkg);
  const candidates = [
    relative ? path.join(pkgDir, relative) : "",
    path.join(pkgDir, "src/index.ts"),
    path.join(pkgDir, "src/plugin.ts"),
    path.join(pkgDir, "src/theme.ts"),
  ].filter(Boolean);
  for (const filePath of candidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return { source: fs.readFileSync(filePath, "utf8"), filePath };
    }
  }
  return { source: "", filePath: relative ? path.join(pkgDir, relative) : "" };
};

const inspectPlugin = (rootDir, pkgDir) => {
  const pkgPath = path.join(pkgDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  const pkg = readJson(pkgPath);
  const packageName = pkg.name ?? "";
  const directory = path.relative(rootDir, pkgDir);
  const official = OFFICIAL_PLUGINS.find((item) => item.packageName === packageName);
  const meta = pkg.ingotScaffold;
  const { source, filePath } = readEntrySource(pkgDir, pkg);
  const exportNames = source ? collectExportNames(source) : [];
  const hasCss = Boolean(pkg.exports?.["./style.css"]);

  if (official) {
    return {
      packageName,
      directory,
      id: official.id,
      label: official.label,
      exportName: official.exportName,
      canonicalPrefix: official.canonicalPrefix,
      available: true,
      reason: "",
      source: "official",
      exportNames,
      hasCss,
    };
  }

  if (meta?.kind === "plugin") {
    const exportName = String(meta.exportName ?? "");
    const available = Boolean(exportName && exportNames.includes(exportName));
    return {
      packageName,
      directory,
      id: String(meta.id ?? ""),
      label: packageName,
      exportName,
      canonicalPrefix: String(meta.canonicalPrefix ?? ""),
      available,
      reason: available ? "" : "ingotScaffold.exportName 与公开入口不一致",
      source: "metadata",
      exportNames,
      hasCss,
    };
  }

  return {
    packageName,
    directory,
    id: "",
    label: packageName,
    exportName: exportNames.length === 1 ? exportNames[0] : "",
    canonicalPrefix: "",
    available: exportNames.length > 0,
    reason: exportNames.length ? "" : "未找到公开导出名，预览时需手动填写",
    source: "manual",
    exportNames,
    hasCss,
    entryPath: filePath ? path.relative(rootDir, filePath) : "",
  };
};

const inspectTheme = (rootDir, pkgDir) => {
  const pkgPath = path.join(pkgDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  const pkg = readJson(pkgPath);
  const packageName = pkg.name ?? "";
  const directory = path.relative(rootDir, pkgDir);
  const meta = pkg.ingotScaffold;
  const { source } = readEntrySource(pkgDir, pkg);
  const exportNames = source ? collectExportNames(source) : [];
  const cssExport = Boolean(pkg.exports?.["./style.css"]);
  const base = {
    packageName,
    directory,
    label: pkg.description || packageName,
    exportNames,
    hasCss: cssExport,
    available: cssExport && exportNames.length > 0,
    reason: "",
  };
  if (!cssExport) {
    base.available = false;
    base.reason = "缺少 ./style.css 公开出口";
  }
  if (meta?.kind === "theme") {
    const exportName = String(meta.exportName ?? "");
    return {
      ...base,
      id: String(meta.id ?? ""),
      exportName,
      available: base.available && exportNames.includes(exportName),
      reason: exportNames.includes(exportName) ? base.reason : "ingotScaffold.exportName 与公开入口不一致",
      source: "metadata",
    };
  }
  return {
    ...base,
    id: "",
    exportName: exportNames.length === 1 ? exportNames[0] : "",
    source: "manual",
    reason: base.reason || (exportNames.length ? "" : "未找到主题导出名，需手动填写"),
  };
};

export const loadCatalog = (rootDir) => {
  const plugins = listPackageDirs(rootDir, "plugins")
    .map((dir) => inspectPlugin(rootDir, dir))
    .filter(Boolean);
  const themes = listPackageDirs(rootDir, "themes")
    .map((dir) => inspectTheme(rootDir, dir))
    .filter(Boolean);
  return {
    plugins,
    themes,
    defaultTheme: DEFAULT_THEME,
  };
};

export const resolveSelectedPlugins = (rootDir, selections) => {
  const catalog = loadCatalog(rootDir);
  return selections.map((selection) => {
    const official = OFFICIAL_PLUGINS.find((plugin) => plugin.packageName === selection.packageName);
    if (official) {
      return {
        ...official,
        exportName: selection.exportName || official.exportName,
        exportNames: [official.exportName],
        hasCss: false,
      };
    }
    const item = catalog.plugins.find((plugin) => plugin.packageName === selection.packageName);
    if (!item) {
      throw new Error(`未找到插件 ${selection.packageName}`);
    }
    const exportName = selection.exportName || item.exportName;
    if (!item.available && item.source !== "manual") {
      throw new Error(item.reason || `插件 ${selection.packageName} 不可用`);
    }
    if (!exportName) {
      throw new Error(`插件 ${selection.packageName} 需要填写导出名`);
    }
    if (item.exportNames.length > 0 && !item.exportNames.includes(exportName)) {
      throw new Error(`插件 ${selection.packageName} 公开入口不包含 ${exportName}`);
    }
    return { ...item, exportName };
  });
};

export const resolveSelectedTheme = (rootDir, theme) => {
  if (!theme || theme.kind === "default") {
    return { ...DEFAULT_THEME };
  }
  const catalog = loadCatalog(rootDir);
  const item = catalog.themes.find((entry) => entry.packageName === theme.packageName);
  if (!item) {
    throw new Error(`未找到主题 ${theme.packageName}`);
  }
  const exportName = theme.exportName || item.exportName;
  if (!item.available && item.source !== "manual") {
    throw new Error(item.reason || `主题 ${theme.packageName} 不可用`);
  }
  if (!exportName) {
    throw new Error(`主题 ${theme.packageName} 需要填写导出名`);
  }
  if (item.exportNames.length > 0 && !item.exportNames.includes(exportName)) {
    throw new Error(`主题 ${theme.packageName} 公开入口不包含 ${exportName}`);
  }
  if (!item.hasCss) {
    throw new Error(`主题 ${theme.packageName} 缺少 CSS 出口`);
  }
  return { ...item, kind: "workspace", exportName, cssExport: `${item.packageName}/style.css` };
};

export const catalogMetaFor = (rootDir, request) => {
  if (request.kind === "app") {
    const plugins = resolveSelectedPlugins(rootDir, request.options.plugins);
    const theme = resolveSelectedTheme(rootDir, request.options.theme);
    return {
      plugins: plugins.map((plugin) => ({
        packageName: plugin.packageName,
        directory: plugin.directory,
        exportName: plugin.exportName,
        source: plugin.source,
      })),
      theme: {
        kind: theme.kind,
        packageName: theme.packageName,
        exportName: theme.exportName,
        directory: theme.directory ?? "",
      },
    };
  }
  return {};
};

export const publicCatalog = (rootDir) => {
  const catalog = loadCatalog(rootDir);
  return {
    plugins: catalog.plugins.map((plugin) => ({
      packageName: plugin.packageName,
      directory: plugin.directory,
      id: plugin.id,
      label: plugin.label,
      exportName: plugin.exportName,
      canonicalPrefix: plugin.canonicalPrefix ?? "",
      available: plugin.available,
      reason: plugin.reason || "",
      source: plugin.source,
    })),
    themes: [
      {
        packageName: DEFAULT_THEME.packageName,
        directory: "packages/admin-core",
        id: DEFAULT_THEME.id,
        label: DEFAULT_THEME.label,
        exportName: DEFAULT_THEME.exportName,
        available: true,
        reason: "",
        source: "official",
      },
      ...catalog.themes.map((theme) => ({
        packageName: theme.packageName,
        directory: theme.directory,
        id: theme.id,
        label: theme.label,
        exportName: theme.exportName,
        available: theme.available,
        reason: theme.reason || "",
        source: theme.source,
      })),
    ],
  };
};
