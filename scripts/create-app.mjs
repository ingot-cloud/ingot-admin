#!/usr/bin/env node

/**
 * 基于薄组合入口模板创建新的后台 app。
 * 用法：
 *   pnpm create:app
 *   pnpm create:app my-app
 * 图形界面：pnpm --filter create-app dev
 */
import readline from "node:readline";
import { OFFICIAL_PLUGINS, scaffoldApp, toKebab } from "./lib/scaffold-app.mjs";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const log = (message, color = "reset") => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const main = async () => {
  const argName = process.argv[2];
  const rawName = argName || (await question("App 名称 (kebab-case，如 acme-admin): "));
  const appCode = toKebab(rawName);
  if (!appCode) {
    throw new Error("无效的 app 名称");
  }

  const portInput = (await question("开发端口 [5800]: ")).trim() || "5800";
  const titleInput = (await question(`标题 [${appCode}]: `)).trim() || appCode;

  const available = OFFICIAL_PLUGINS.filter((plugin) => plugin.available);
  log(`官方插件: ${available.map((plugin) => plugin.id).join(", ")}`, "yellow");
  const pluginInput = (
    await question("勾选官方插件，逗号分隔 [ingot-admin]: ")
  )
    .trim()
    .toLowerCase();
  const officialPluginIds = (pluginInput || "ingot-admin")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const withPlugin =
    ((await question("是否生成本地插件骨架? (Y/n): ")).trim().toLowerCase() || "y") !== "n";

  const result = scaffoldApp({
    appCode,
    port: portInput,
    title: titleInput,
    officialPluginIds,
    withLocalPlugin: withPlugin,
  });

  log(`\n✓ 已创建 apps/${result.appCode}`, "green");
  log("接下来：", "yellow");
  log(`  1. pnpm install`);
  log(`  2. 按需修改 apps/${result.appCode}/.env`);
  log(`  3. pnpm --filter ${result.appCode} dev`);
  log(`文档见 docs/create-app.md`);
};

main()
  .catch((error) => {
    log(String(error.message || error), "red");
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
  });
