#!/usr/bin/env node

/**
 * 创建后台 App。
 *   pnpm create:app:cli
 *   pnpm create:app:cli acme-admin
 *   pnpm create:app:cli --config ./app.json --dry-run
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScaffoldCli, log } from "./lib/scaffold/cli.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

runScaffoldCli({ kind: "app", argv: process.argv.slice(2), rootDir }).catch((error) => {
  log(String(error.message || error), "red");
  process.exitCode = 1;
});
