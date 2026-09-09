#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkBoundaries } from "./lib/check-boundaries.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { errors } = checkBoundaries(rootDir);

if (errors.length > 0) {
  console.error("分层边界检查失败：");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("✓ 分层边界检查通过");
