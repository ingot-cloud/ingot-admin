#!/usr/bin/env node

/**
 * 检查文档相对链接，以及 README / docs / examples 中的过时命令和包名。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildCoverage, listGlobalComponents, vitepressSlug } from "../apps/dev-portal/scripts/public-api.mjs";
import { writeGeneratedReference } from "../apps/dev-portal/scripts/generate-reference.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DOC_GLOBS = ["README.md", "AGENTS.md", "docs", "examples", "themes", ".agents/skills"];
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

try {
  const pageMap = await import(pathToFileURL(path.join(rootDir, "apps/dev-portal/page-map.mjs")).href);
  for (const page of pageMap.PAGE_MAP) {
    const source = path.join(rootDir, page.source);
    if (!fs.existsSync(source)) {
      errors.push(`门户页面映射源不存在：${page.source}`);
    }
  }
} catch (error) {
  errors.push(`无法读取门户页面映射：${error instanceof Error ? error.message : String(error)}`);
}

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

const coverage = buildCoverage(rootDir);
const headingSlugs = (markdown) =>
  [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
    const explicit = match[1].match(/\{#([^}]+)\}/);
    return explicit ? explicit[1] : vitepressSlug(match[1].replace(/\s*\{#[^}]+\}\s*$/, ""));
  });

const generatedDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-docs-ref-"));
writeGeneratedReference(rootDir, generatedDir);
const componentsMd = fs.readFileSync(path.join(generatedDir, "reference/components.md"), "utf8");
const modulesMd = fs.readFileSync(path.join(generatedDir, "reference/modules.md"), "utf8");
const pluginsMd = fs.readFileSync(path.join(generatedDir, "reference/plugins.md"), "utf8");
const componentSlugs = new Set(headingSlugs(componentsMd));
const moduleSlugs = new Set(headingSlugs(modulesMd));
const pluginSlugs = new Set(headingSlugs(pluginsMd));
fs.rmSync(generatedDir, { recursive: true, force: true });

for (const name of listGlobalComponents(rootDir)) {
  if (!coverage.entries[name]) {
    errors.push(`公开组件 ${name} 未写入覆盖清单`);
  }
}
for (const [name, entry] of Object.entries(coverage.entries)) {
  const doc = String(entry.doc ?? "");
  const hash = doc.split("#")[1];
  if (!hash) {
    errors.push(`覆盖清单 ${name} 缺少文档锚点`);
    continue;
  }
  if (doc.includes("/reference/modules") && !moduleSlugs.has(hash)) {
    errors.push(`覆盖清单 ${name} 指向不存在的模块锚点 #${hash}`);
  }
  if (doc.includes("/reference/components") && !componentSlugs.has(hash)) {
    errors.push(`覆盖清单 ${name} 指向不存在的组件锚点 #${hash}`);
  }
  if (doc.includes("/reference/plugins") && !pluginSlugs.has(hash)) {
    errors.push(`覆盖清单 ${name} 指向不存在的插件锚点 #${hash}`);
  }
  if (entry.demo) {
    const demoId = entry.exampleId;
    if (!demoId) {
      errors.push(`覆盖清单 ${name} 标记了 demo 但缺少 exampleId`);
    }
  }
}

const demoApp = fs.readFileSync(path.join(rootDir, "apps/dev-portal/demos/DemoApp.vue"), "utf8");
for (const demoId of new Set(Object.values(coverage.entries).map((entry) => entry.exampleId).filter(Boolean))) {
  if (!demoApp.includes(demoId)) {
    errors.push(`演示入口缺少 ${demoId}`);
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
