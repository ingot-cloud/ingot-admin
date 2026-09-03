import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { ADMIN_CORE_AUTO_IMPORTS } from "./official-plugins.js";

const COMPONENT_EXTS = new Set([".vue"]);
const SCRIPT_EXTS = new Set([".ts", ".js", ".tsx", ".jsx"]);
const SKIP_FILE = /\.(d|spec|test)\.(ts|js|tsx|jsx)$/;

const FRAMEWORK_RESERVED_EXPORTS = [
  "ref",
  "computed",
  "reactive",
  "readonly",
  "watch",
  "watchEffect",
  "onMounted",
  "onUnmounted",
  "onBeforeMount",
  "onBeforeUnmount",
  "defineStore",
  "storeToRefs",
  "acceptHMRUpdate",
  "createPinia",
  "useRouter",
  "useRoute",
  "useLink",
  "onBeforeRouteLeave",
  "onBeforeRouteUpdate",
] as const;

const EXPORT_NAME_RE = /export\s+(?:const|function|async function|let|class)\s+([A-Za-z_$][\w$]*)/g;

export const RESERVED_AUTO_IMPORT_NAMES = new Set<string>([
  ...((ADMIN_CORE_AUTO_IMPORTS["@ingot/admin-core"] ?? []) as string[]),
  ...FRAMEWORK_RESERVED_EXPORTS,
]);

export interface AppConventionScanOptions {
  rootDir: string;
  componentDirs?: string[];
  scriptDirs?: string[];
  reservedExportNames?: Iterable<string>;
}

const toWalkDir = (pattern: string, rootDir: string): string => {
  const trimmed = pattern
    .replace(/^\.\//, "")
    .replace(/\/\*\*$/, "")
    .replace(/\/\*$/, "");
  return path.resolve(rootDir, trimmed);
};

const listFiles = (dir: string, exts: Set<string>): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const result: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFiles(fullPath, exts));
      continue;
    }
    if (SKIP_FILE.test(entry.name)) {
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      result.push(fullPath);
    }
  }
  return result;
};

const collectExportNames = (source: string): string[] => {
  const names: string[] = [];
  for (const match of source.matchAll(EXPORT_NAME_RE)) {
    if (match[1]) {
      names.push(match[1]);
    }
  }
  return names;
};

export const collectAppConventionViolations = (
  options: AppConventionScanOptions,
): string[] => {
  const reserved = new Set(options.reservedExportNames ?? RESERVED_AUTO_IMPORT_NAMES);
  const violations: string[] = [];
  const componentDirs = options.componentDirs ?? ["./src/components"];
  const scriptDirs = options.scriptDirs ?? ["./src/hooks/**", "./src/stores/**"];

  for (const dirPattern of componentDirs) {
    const dir = toWalkDir(dirPattern, options.rootDir);
    for (const file of listFiles(dir, COMPONENT_EXTS)) {
      const name = path.basename(file, path.extname(file));
      const relative = path.relative(options.rootDir, file);
      if (name.startsWith("In") || name.startsWith("El")) {
        violations.push(`${relative}：组件名 “${name}” 使用了保留前缀 In*/El*`);
      }
    }
  }

  for (const dirPattern of scriptDirs) {
    const dir = toWalkDir(dirPattern, options.rootDir);
    for (const file of listFiles(dir, SCRIPT_EXTS)) {
      const source = fs.readFileSync(file, "utf8");
      const relative = path.relative(options.rootDir, file);
      for (const exportName of collectExportNames(source)) {
        if (reserved.has(exportName)) {
          violations.push(`${relative}：导出名 “${exportName}” 与自动导入保留名冲突`);
        }
      }
    }
  }

  return violations;
};

export const createAppConventionGuard = (options: AppConventionScanOptions): Plugin => {
  const scan = () => {
    const violations = collectAppConventionViolations(options);
    if (violations.length > 0) {
      throw new Error(`App 约定目录冲突：\n${violations.map((item) => `- ${item}`).join("\n")}`);
    }
  };

  return {
    name: "ingot-app-convention-guard",
    buildStart: scan,
    configureServer() {
      scan();
    },
  };
};
