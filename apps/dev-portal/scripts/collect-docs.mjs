#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicSchema } from "../../../scripts/lib/scaffold/schema.mjs";
import { LINK_REWRITE, PAGE_MAP } from "../page-map.mjs";
import { writeGeneratedReference } from "./generate-reference.mjs";
import { buildCoverage } from "./public-api.mjs";

const portalDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(portalDir, "../..");
const generatedDir = path.join(portalDir, ".generated");
const publicDir = path.join(portalDir, "public");

const rewriteLinks = (source) => {
  let text = source;
  for (const rule of LINK_REWRITE) {
    text = text.replaceAll(`](${rule.from})`, `](${rule.to})`);
    text = text.replaceAll(`](${rule.from.replace(/^\.\//, "")})`, `](${rule.to})`);
  }
  return text;
};

export const collectDocs = () => {
  fs.rmSync(generatedDir, { recursive: true, force: true });
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  for (const page of PAGE_MAP) {
    const from = path.join(repoRoot, page.source);
    const to = path.join(generatedDir, page.dest);
    if (!fs.existsSync(from)) {
      throw new Error(`文档源不存在: ${page.source}`);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, rewriteLinks(fs.readFileSync(from, "utf8")));
  }
  writeGeneratedReference(repoRoot, generatedDir);
  const schema = `${JSON.stringify(getPublicSchema(), null, 2)}\n`;
  fs.writeFileSync(path.join(generatedDir, "scaffold-schema.json"), schema);
  fs.writeFileSync(path.join(publicDir, "scaffold-schema.json"), schema);
  const coverage = buildCoverage(repoRoot);
  fs.writeFileSync(path.join(generatedDir, "coverage.json"), `${JSON.stringify(coverage, null, 2)}\n`);
};

if (process.argv[1] && path.normalize(process.argv[1]).endsWith("collect-docs.mjs")) {
  collectDocs();
}
