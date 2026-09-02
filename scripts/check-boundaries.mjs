#!/usr/bin/env node

/**
 * 分层边界检查：apps → plugins/packages，plugins → packages，packages 互不依赖 apps/plugins。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const OFFICIAL_PLUGINS = [
  { dir: "plugins/platform", packageName: "@ingot/platform-plugin" },
  { dir: "plugins/security", packageName: "@ingot/security-plugin" },
  { dir: "plugins/org", packageName: "@ingot/org-plugin" },
  { dir: "plugins/member", packageName: "@ingot/member-plugin" },
];

const OFFICIAL_PLUGIN_PACKAGES = OFFICIAL_PLUGINS.map((plugin) => plugin.packageName);

const LEGACY_APP_PACKAGES = [
  "@ingot/platform-app",
  "@ingot/security-app",
  "@ingot/org-app",
  "@ingot/member-app",
];

const APP_PACKAGES = ["@ingot/admin-app", "@ingot/auth-app", "create-app"];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs"]);
const IGNORED_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  ".turbo",
  ".output",
]);

const errors = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const exists = (relativePath) => fs.existsSync(path.join(rootDir, relativePath));

const collectSourceFiles = (dir) => {
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
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
};

const importSpecifiers = (source) => {
  const specifiers = [];
  const patterns = [
    /from\s+["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /export\s+\*\s+from\s+["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
};

const packageDepNames = (pkg) => {
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const names = new Set();
  for (const section of sections) {
    for (const name of Object.keys(pkg[section] ?? {})) {
      names.add(name);
    }
  }
  return names;
};

const isInsideDir = (filePath, dir) => {
  const relative = path.relative(dir, filePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

const checkNoAtBase = (relativeDir) => {
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

const checkNoLegacyAppPackages = (relativeDir) => {
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

const checkOfficialPluginIsolation = () => {
  const existing = OFFICIAL_PLUGINS.filter((plugin) => exists(plugin.dir));
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

const checkPackagesDoNotDependOnAppsOrPlugins = () => {
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

const checkPluginManifestAlignment = () => {
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

checkNoAtBase("packages/admin-common");
checkNoAtBase("packages/admin-core");
for (const plugin of OFFICIAL_PLUGINS) {
  checkNoAtBase(plugin.dir);
  checkNoLegacyAppPackages(plugin.dir);
}
checkNoAtBase("apps/admin");
checkNoLegacyAppPackages("apps/admin");
checkOfficialPluginIsolation();
checkPackagesDoNotDependOnAppsOrPlugins();
checkPluginManifestAlignment();

if (errors.length > 0) {
  console.error("分层边界检查失败：");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("✓ 分层边界检查通过");
