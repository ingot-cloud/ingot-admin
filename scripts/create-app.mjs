#!/usr/bin/env node

/**
 * 基于薄组合入口模板创建新的后台 app（含可选本地插件骨架）。
 * 用法：
 *   pnpm create:app
 *   pnpm create:app my-app
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "scripts/templates/admin-app");

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

const toKebab = (value) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();

const copyDir = (from, to, replacements) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const destName = entry.name.replace(/__APP__/g, replacements.appCode);
    const dest = path.join(to, destName);
    if (entry.isDirectory()) {
      copyDir(src, dest, replacements);
      continue;
    }
    let content = fs.readFileSync(src, "utf8");
    for (const [token, value] of Object.entries(replacements)) {
      content = content.replaceAll(`{{${token}}}`, value);
    }
    fs.writeFileSync(dest, content);
  }
};

const main = async () => {
  if (!fs.existsSync(templateDir)) {
    throw new Error(`模板目录不存在: ${templateDir}`);
  }

  const argName = process.argv[2];
  const rawName = argName || (await question("App 名称 (kebab-case，如 acme-admin): "));
  const appCode = toKebab(rawName);
  if (!appCode) {
    throw new Error("无效的 app 名称");
  }

  const portInput = (await question("开发端口 [5800]: ")).trim() || "5800";
  const withPlugin =
    ((await question("是否生成本地插件骨架? (Y/n): ")).trim().toLowerCase() || "y") !== "n";

  const appDir = path.join(rootDir, "apps", appCode);
  if (fs.existsSync(appDir)) {
    throw new Error(`目录已存在: ${appDir}`);
  }

  const replacements = {
    appCode,
    appTitle: appCode,
    port: portInput,
    storePrefix: `__${appCode.replace(/-/g, "_")}__`,
    pluginId: `${appCode}-feature`,
    pageKeyPrefix: appCode.replace(/-/g, "."),
  };

  copyDir(templateDir, appDir, replacements);

  if (!withPlugin) {
    fs.rmSync(path.join(appDir, "src/plugins"), { recursive: true, force: true });
    fs.rmSync(path.join(appDir, "src/pages/demo"), { recursive: true, force: true });
    fs.rmSync(path.join(appDir, "src/components"), { recursive: true, force: true });
    fs.rmSync(path.join(appDir, "src/directives"), { recursive: true, force: true });
    fs.rmSync(path.join(appDir, "src/stores"), { recursive: true, force: true });
    const mainPath = path.join(appDir, "src/main.ts");
    let main = fs.readFileSync(mainPath, "utf8");
    main = main
      .replace(/import \{ targetPlugin \} from "\.\/plugins\/targetPlugin";\n/, "")
      .replace(/plugins: \[adminBasePlugin, targetPlugin\]/, "plugins: [adminBasePlugin]");
    fs.writeFileSync(mainPath, main);
  }

  log(`\n✓ 已创建 apps/${appCode}`, "green");
  log("接下来：", "yellow");
  log(`  1. pnpm install`);
  log(`  2. 按需修改 apps/${appCode}/.env`);
  log(`  3. pnpm --filter ${appCode} dev`);
  log(`文档见 docs/composable-admin-runtime.md`);
  rl.close();
};

main().catch((error) => {
  log(String(error.message || error), "red");
  rl.close();
  process.exit(1);
});
