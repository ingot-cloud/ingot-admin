/**
 * 分层边界检查：apps → plugins/themes/packages，plugins → packages，
 * themes → packages，packages 仅依赖其它 packages。
 */
import fs from "node:fs";
import path from "node:path";

export const OFFICIAL_PLUGINS = [
  { dir: "plugins/platform", packageName: "@ingot/platform-plugin" },
  { dir: "plugins/security", packageName: "@ingot/security-plugin" },
  { dir: "plugins/org", packageName: "@ingot/org-plugin" },
  { dir: "plugins/member", packageName: "@ingot/member-plugin" },
];

export const OFFICIAL_PLUGIN_PACKAGES = OFFICIAL_PLUGINS.map((plugin) => plugin.packageName);

export const LEGACY_APP_PACKAGES = [
  "@ingot/platform-app",
  "@ingot/security-app",
  "@ingot/org-app",
  "@ingot/member-app",
];

export const APP_PACKAGES = ["@ingot/admin-app", "@ingot/auth-app", "create-app"];

export const WORKSPACE_LAYERS = ["apps", "plugins", "themes", "packages"];

const ALLOWED_DEP_LAYERS = {
  apps: new Set(["plugins", "themes", "packages"]),
  plugins: new Set(["packages"]),
  themes: new Set(["packages"]),
  packages: new Set(["packages"]),
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs", ".mts", ".cts"]);
const IGNORED_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  ".turbo",
  ".output",
]);

const LAYER_LABEL = {
  apps: "App",
  plugins: "插件",
  themes: "主题",
  packages: "公共包",
};

export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

export const importSpecifiers = (source) => {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers];
};

export const packageDepEntries = (pkg) => {
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const entries = [];
  for (const section of sections) {
    for (const [name, version] of Object.entries(pkg[section] ?? {})) {
      entries.push({ section, name, version });
    }
  }
  return entries;
};

export const packageDepNames = (pkg) => new Set(packageDepEntries(pkg).map((entry) => entry.name));

export const isInsideDir = (filePath, dir) => {
  const relative = path.relative(dir, filePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

export const collectSourceFiles = (dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) {
        continue;
      }
      results.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith(".d.ts")) {
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
};

const existsIn = (rootDir, relativePath) => fs.existsSync(path.join(rootDir, relativePath));

export const discoverWorkspacePackages = (rootDir) => {
  const packages = [];
  for (const layer of WORKSPACE_LAYERS) {
    const layerDir = path.join(rootDir, layer);
    if (!fs.existsSync(layerDir)) {
      continue;
    }
    for (const entry of fs.readdirSync(layerDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const absDir = path.join(layerDir, entry.name);
      const pkgPath = path.join(absDir, "package.json");
      if (!fs.existsSync(pkgPath)) {
        continue;
      }
      const pkg = readJson(pkgPath);
      packages.push({
        layer,
        id: entry.name,
        dir: path.join(layer, entry.name),
        absDir,
        name: pkg.name ?? `${layer}/${entry.name}`,
        pkg,
      });
    }
  }
  return packages;
};

const packagesByName = (packages) => {
  const map = new Map();
  for (const item of packages) {
    map.set(item.name, item);
  }
  return map;
};

export const matchWorkspacePackage = (specifier, byName) => {
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (specifier === name || specifier.startsWith(`${name}/`)) {
      return byName.get(name);
    }
  }
  return undefined;
};

export const specifierSubpath = (specifier, packageName) => {
  if (specifier === packageName) {
    return ".";
  }
  if (specifier.startsWith(`${packageName}/`)) {
    return `./${specifier.slice(packageName.length + 1)}`;
  }
  return undefined;
};

export const isSubpathExported = (pkg, subpath) => {
  const exportsField = pkg.exports;
  if (subpath === "./package.json") {
    return true;
  }
  if (!exportsField) {
    return subpath === ".";
  }
  if (typeof exportsField === "string") {
    return subpath === ".";
  }
  if (Object.prototype.hasOwnProperty.call(exportsField, subpath)) {
    return true;
  }
  for (const key of Object.keys(exportsField)) {
    if (!key.includes("*")) {
      continue;
    }
    const pattern = new RegExp(
      `^${key.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`,
    );
    if (pattern.test(subpath)) {
      return true;
    }
  }
  return false;
};

const ownerByPath = (filePath, packages) => {
  const owners = packages.filter((item) => isInsideDir(filePath, item.absDir));
  owners.sort((a, b) => b.absDir.length - a.absDir.length);
  return owners[0];
};

const layerRuleMessage = (from, toName, toLayer) =>
  `${from.name} 不得依赖 ${toName}（${LAYER_LABEL[from.layer]}不能依赖${LAYER_LABEL[toLayer]}）`;

const sourceLayerMessage = (relativeFile, toName, fromLayer, toLayer) =>
  `${relativeFile} 不得导入 ${toName}（${LAYER_LABEL[fromLayer]}不能依赖${LAYER_LABEL[toLayer]}）`;

const allowedToDepend = (fromLayer, toLayer) => ALLOWED_DEP_LAYERS[fromLayer].has(toLayer);

const checkNoAtBase = (rootDir, errors, relativeDir) => {
  const absDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(absDir)) {
    return;
  }
  for (const filePath of collectSourceFiles(absDir)) {
    const source = fs.readFileSync(filePath, "utf8");
    if (/(?:from|import)\s*\(?\s*["']@base(?:\/|["'])/.test(source) || /["']@base\//.test(source)) {
      errors.push(`${path.relative(rootDir, filePath)} 不得使用 @base`);
    }
  }
};

const checkNoLegacyAppPackages = (rootDir, errors, relativeDir) => {
  const absDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(absDir)) {
    return;
  }
  for (const filePath of collectSourceFiles(absDir)) {
    const source = fs.readFileSync(filePath, "utf8");
    for (const specifier of importSpecifiers(source)) {
      for (const name of LEGACY_APP_PACKAGES) {
        if (specifier === name || specifier.startsWith(`${name}/`)) {
          errors.push(`${path.relative(rootDir, filePath)} 不得导入已迁移的 ${name}`);
        }
      }
    }
  }
};

const checkOfficialPluginIsolation = (rootDir, errors) => {
  const existing = OFFICIAL_PLUGINS.filter((plugin) => existsIn(rootDir, plugin.dir));
  for (const plugin of existing) {
    const absDir = path.join(rootDir, plugin.dir);
    const pkg = readJson(path.join(absDir, "package.json"));
    const deps = packageDepNames(pkg);
    for (const other of OFFICIAL_PLUGINS) {
      if (other.packageName === plugin.packageName) {
        continue;
      }
      if (deps.has(other.packageName)) {
        errors.push(`${plugin.packageName} 不得依赖 ${other.packageName}`);
      }
    }
    for (const appPackage of APP_PACKAGES) {
      if (deps.has(appPackage)) {
        errors.push(`${plugin.packageName} 不得依赖 App 包 ${appPackage}`);
      }
    }

    for (const filePath of collectSourceFiles(path.join(absDir, "src"))) {
      const source = fs.readFileSync(filePath, "utf8");
      for (const specifier of importSpecifiers(source)) {
        for (const other of OFFICIAL_PLUGINS) {
          if (other.packageName === plugin.packageName) {
            continue;
          }
          if (specifier === other.packageName || specifier.startsWith(`${other.packageName}/`)) {
            errors.push(
              `${path.relative(rootDir, filePath)} 不得导入 ${other.packageName}（来自 ${specifier}）`,
            );
          }
        }
        for (const appPackage of APP_PACKAGES) {
          if (specifier === appPackage || specifier.startsWith(`${appPackage}/`)) {
            errors.push(`${path.relative(rootDir, filePath)} 不得导入 App 包 ${appPackage}`);
          }
        }
        if (specifier.startsWith(".")) {
          const resolved = path.resolve(path.dirname(filePath), specifier);
          if (isInsideDir(resolved, path.join(rootDir, "apps"))) {
            errors.push(`${path.relative(rootDir, filePath)} 不得通过相对路径导入 apps/`);
          }
          for (const other of existing) {
            if (other.packageName === plugin.packageName) {
              continue;
            }
            const otherRoot = path.join(rootDir, other.dir);
            if (isInsideDir(resolved, otherRoot)) {
              errors.push(
                `${path.relative(rootDir, filePath)} 不得通过相对路径导入 ${other.packageName}`,
              );
            }
          }
        }
      }
    }
  }
};

const checkPackagesDoNotDependOnAppsOrPlugins = (rootDir, errors) => {
  const packagesDir = path.join(rootDir, "packages");
  if (!fs.existsSync(packagesDir)) {
    return;
  }
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const pkgDir = path.join(packagesDir, entry.name);
    const pkgPath = path.join(pkgDir, "package.json");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    const pkg = readJson(pkgPath);
    const deps = packageDepNames(pkg);
    for (const name of [...OFFICIAL_PLUGIN_PACKAGES, ...APP_PACKAGES, ...LEGACY_APP_PACKAGES]) {
      if (deps.has(name)) {
        errors.push(`${pkg.name ?? entry.name} 不得依赖 ${name}`);
      }
    }
    for (const filePath of collectSourceFiles(path.join(pkgDir, "src"))) {
      const source = fs.readFileSync(filePath, "utf8");
      for (const specifier of importSpecifiers(source)) {
        for (const name of [...OFFICIAL_PLUGIN_PACKAGES, ...APP_PACKAGES, ...LEGACY_APP_PACKAGES]) {
          if (specifier === name || specifier.startsWith(`${name}/`)) {
            errors.push(`${path.relative(rootDir, filePath)} 不得导入 ${name}`);
          }
        }
        if (specifier.startsWith(".")) {
          const resolved = path.resolve(path.dirname(filePath), specifier);
          if (
            isInsideDir(resolved, path.join(rootDir, "apps")) ||
            isInsideDir(resolved, path.join(rootDir, "plugins"))
          ) {
            errors.push(`${path.relative(rootDir, filePath)} 不得相对导入 apps/ 或 plugins/`);
          }
        }
      }
    }
  }
};

const officialPackagesFromImports = (source) => {
  const found = new Set();
  for (const specifier of importSpecifiers(source)) {
    for (const packageName of OFFICIAL_PLUGIN_PACKAGES) {
      if (specifier === packageName || specifier.startsWith(`${packageName}/`)) {
        found.add(packageName);
      }
    }
  }
  return found;
};

const checkPluginManifestAlignment = (rootDir, errors) => {
  const appsDir = path.join(rootDir, "apps");
  if (!fs.existsSync(appsDir)) {
    return;
  }
  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const appDir = path.join(appsDir, entry.name);
    const pkgPath = path.join(appDir, "package.json");
    const pluginsPath = path.join(appDir, "src/plugins.ts");
    const mainPath = path.join(appDir, "src/main.ts");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    const manifestPath = fs.existsSync(pluginsPath) ? pluginsPath : mainPath;
    if (!fs.existsSync(manifestPath)) {
      continue;
    }
    const pkg = readJson(pkgPath);
    const packageName = pkg.name ?? "";
    if (packageName === "create-app") {
      continue;
    }
    const deps = packageDepNames(pkg);
    const declared = OFFICIAL_PLUGIN_PACKAGES.filter((name) => deps.has(name));
    const imported = [...officialPackagesFromImports(fs.readFileSync(manifestPath, "utf8"))];
    const declaredSet = new Set(declared);
    const importedSet = new Set(imported);
    for (const name of declaredSet) {
      if (!importedSet.has(name)) {
        errors.push(
          `${packageName} 依赖了 ${name}，但 ${path.relative(appDir, manifestPath)} 未导入该官方插件`,
        );
      }
    }
    for (const name of importedSet) {
      if (!declaredSet.has(name)) {
        errors.push(
          `${packageName} 的 ${path.relative(appDir, manifestPath)} 导入了 ${name}，但 package.json 未声明依赖`,
        );
      }
    }
  }
};

const checkLayerAndThemeRules = (rootDir, errors, packages) => {
  const byName = packagesByName(packages);
  for (const from of packages) {
    for (const { name } of packageDepEntries(from.pkg)) {
      if (LEGACY_APP_PACKAGES.includes(name)) {
        errors.push(`${from.name} 不得依赖已迁移的 ${name}`);
        continue;
      }
      const target = byName.get(name);
      if (!target || target.name === from.name) {
        continue;
      }
      if (from.layer === "themes" && target.layer === "themes") {
        errors.push(`${from.name} 不得依赖另一主题 ${target.name}`);
        continue;
      }
      if (!allowedToDepend(from.layer, target.layer)) {
        errors.push(layerRuleMessage(from, target.name, target.layer));
      }
    }

    for (const filePath of collectSourceFiles(from.absDir)) {
      const relativeFile = path.relative(rootDir, filePath);
      const source = fs.readFileSync(filePath, "utf8");
      if (from.layer === "themes" && /["']@\//.test(source)) {
        errors.push(`${relativeFile} 不得使用 @/ 别名`);
      }
      for (const specifier of importSpecifiers(source)) {
        if (specifier.startsWith(".") || specifier.startsWith("/")) {
          const resolved = path.resolve(path.dirname(filePath), specifier);
          const owner = ownerByPath(resolved, packages);
          if (!owner || owner.name === from.name) {
            continue;
          }
          if (from.layer === "themes" && owner.layer === "themes") {
            errors.push(`${relativeFile} 不得通过相对路径导入另一主题 ${owner.name}`);
            continue;
          }
          if (!allowedToDepend(from.layer, owner.layer)) {
            errors.push(
              `${relativeFile} 不得通过相对路径导入 ${owner.name}（${LAYER_LABEL[from.layer]}不能依赖${LAYER_LABEL[owner.layer]}）`,
            );
            continue;
          }
          if (from.layer === "themes") {
            errors.push(
              `${relativeFile} 不得通过相对路径引用 ${owner.name} 源码，请使用包名公开导出`,
            );
          }
          continue;
        }

        const target = matchWorkspacePackage(specifier, byName);
        if (!target || target.name === from.name) {
          continue;
        }
        if (from.layer === "themes" && target.layer === "themes") {
          errors.push(`${relativeFile} 不得导入另一主题 ${target.name}（来自 ${specifier}）`);
          continue;
        }
        if (!allowedToDepend(from.layer, target.layer)) {
          errors.push(sourceLayerMessage(relativeFile, target.name, from.layer, target.layer));
          continue;
        }
        if (from.layer === "themes" && target.layer === "packages") {
          const subpath = specifierSubpath(specifier, target.name);
          if (subpath && !isSubpathExported(target.pkg, subpath)) {
            errors.push(`${relativeFile} 不得绕过 ${target.name} 的公开 exports 导入 ${specifier}`);
          }
        }
      }
    }
  }
};

export const checkBoundaries = (rootDir) => {
  const errors = [];
  const workspacePackages = discoverWorkspacePackages(rootDir);

  checkNoAtBase(rootDir, errors, "packages/admin-common");
  checkNoAtBase(rootDir, errors, "packages/admin-core");
  checkNoAtBase(rootDir, errors, "packages/http-client");
  for (const plugin of OFFICIAL_PLUGINS) {
    checkNoAtBase(rootDir, errors, plugin.dir);
    checkNoLegacyAppPackages(rootDir, errors, plugin.dir);
  }
  checkNoAtBase(rootDir, errors, "apps/admin");
  checkNoLegacyAppPackages(rootDir, errors, "apps/admin");
  for (const theme of workspacePackages.filter((item) => item.layer === "themes")) {
    checkNoAtBase(rootDir, errors, theme.dir);
    checkNoLegacyAppPackages(rootDir, errors, theme.dir);
  }
  checkOfficialPluginIsolation(rootDir, errors);
  checkPackagesDoNotDependOnAppsOrPlugins(rootDir, errors);
  checkPluginManifestAlignment(rootDir, errors);
  checkLayerAndThemeRules(rootDir, errors, workspacePackages);

  return { errors, workspacePackages };
};
