#!/usr/bin/env node

/**
 * 对 workspace glob 执行包脚本。没有匹配包时成功退出（用于空的 themes/）。
 *
 * 用法: node scripts/run-workspace-script.mjs "./themes/*" build
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), "..");

const FILTER_GLOB = /^\.\/([^/]+)\/\*$/;

export const matchingWorkspacePackageDirs = (cwd, glob) => {
  const match = glob.match(FILTER_GLOB);
  if (!match) {
    throw new Error(`不支持的 workspace glob: ${glob}`);
  }
  const layerDir = path.join(cwd, match[1]);
  if (!fs.existsSync(layerDir)) {
    return [];
  }
  return fs
    .readdirSync(layerDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(layerDir, entry.name, "package.json")))
    .map((entry) => path.join(layerDir, entry.name));
};

const run = (cwd, glob, scriptName, extraArgs = []) => {
  const packages = matchingWorkspacePackageDirs(cwd, glob);
  if (packages.length === 0) {
    console.log(`✓ 无匹配 ${glob} 的包，跳过 ${scriptName}`);
    return 0;
  }
  const result = spawnSync(
    "pnpm",
    ["--filter", glob, "--if-present", "run", scriptName, ...extraArgs],
    {
      cwd,
      stdio: "inherit",
      env: process.env,
    },
  );
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
};

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;
if (isDirectRun) {
  const glob = process.argv[2];
  const scriptName = process.argv[3];
  const extraArgs = process.argv.slice(4);
  if (!glob || !scriptName) {
    console.error("用法: node scripts/run-workspace-script.mjs <glob> <script> [...args]");
    process.exit(1);
  }
  process.exit(run(rootDir, glob, scriptName, extraArgs));
}
