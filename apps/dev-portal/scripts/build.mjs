#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectDocs } from "./collect-docs.mjs";

const portalDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: portalDir, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

collectDocs();
run("pnpm", ["exec", "vitepress", "build"]);

const demosConfig = path.join(portalDir, "demos/vite.config.ts");
if (fs.existsSync(demosConfig)) {
  run("pnpm", ["exec", "vite", "build", "--config", "demos/vite.config.ts"]);
}
