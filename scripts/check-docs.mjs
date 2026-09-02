#!/usr/bin/env node

/**
 * 检查文档相对链接，以及 README / docs / examples 中的过时命令和包名。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DOC_GLOBS = ["README.md", "AGENTS.md", "docs", "examples", ".agents/skills"];
const SKIP_DIR_NAMES = new Set(["node_modules", "dist", ".git"]);
const errors = [];

const STALE_PATTERNS = [
  { label: "apps/target-project", pattern: /apps\/target-project/ },
  { label: "@ingot/platform-app", pattern: /@ingot\/platform-app/ },
  { label: "@ingot/security-app", pattern: /@ingot\/security-app/ },
  { label: "@ingot/org-app", pattern: /@ingot\/org-app/ },
  { label: "@ingot/member-app", pattern: /@ingot\/member-app/ },
  { label: "dev:target", pattern: /dev:target/ },
  { label: "build:target", pattern: /build:target/ },
  { label: "dev:platform", pattern: /dev:platform/ },
  { label: "with-utils", pattern: /with-utils/ },
  { label: "official-apps.ts", pattern: /official-apps\.ts/ },
  { label: "packages/utils", pattern: /packages\/utils/ },
];

const collectMarkdownFiles = (target) => {
  const abs = path.join(rootDir, target);
  if (!fs.existsSync(abs)) {
    return [];
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    return abs.endsWith(".md") ? [abs] : [];
  }
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIR_NAMES.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  };
  walk(abs);
  return results;
};

const markdownFiles = DOC_GLOBS.flatMap(collectMarkdownFiles);

const LINK_PATTERN = /\[[^\]]*]\(([^)]+)\)/g;

for (const filePath of markdownFiles) {
  const relative = path.relative(rootDir, filePath);
  const source = fs.readFileSync(filePath, "utf8");
  for (const { label, pattern } of STALE_PATTERNS) {
    if (pattern.test(source)) {
      errors.push(`${relative} 含有过时描述：${label}`);
    }
  }

  for (const match of source.matchAll(LINK_PATTERN)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || /^[a-z]+:\/\//i.test(raw)) {
      continue;
    }
    const withoutAnchor = raw.split("#")[0];
    if (!withoutAnchor) {
      continue;
    }
    const resolved = path.resolve(path.dirname(filePath), withoutAnchor);
    if (!fs.existsSync(resolved)) {
      errors.push(`${relative} 相对链接失效：${raw}`);
    }
  }
}

if (errors.length > 0) {
  console.error("文档检查失败：");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("✓ 文档检查通过");
