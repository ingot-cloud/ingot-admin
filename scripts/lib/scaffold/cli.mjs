import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { OFFICIAL_PLUGINS } from "./constants.mjs";
import { createScaffold, previewScaffold } from "./engine.mjs";
import { ScaffoldError } from "./errors.mjs";
import { normalizeRequest } from "./normalize.mjs";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

export const log = (message, color = "reset") => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const question = (rl, query) => new Promise((resolve) => rl.question(query, resolve));

const parseArgs = (argv) => {
  const args = { positional: [], config: "", dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (item === "--config") {
      args.config = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (item.startsWith("--config=")) {
      args.config = item.slice("--config=".length);
      continue;
    }
    if (item.startsWith("-")) {
      throw new ScaffoldError(`未知参数 ${item}`, { code: "VALIDATION_ERROR" });
    }
    args.positional.push(item);
  }
  return args;
};

const readConfigFile = (filePath, kind) => {
  const abs = path.resolve(filePath);
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (raw.kind && raw.kind !== kind) {
    throw new ScaffoldError("配置 kind 与命令不匹配", { code: "VALIDATION_ERROR" });
  }
  return raw.kind ? raw : { version: 1, kind, options: raw };
};

const printPreview = (preview) => {
  log(`目标：${preview.targetDir}（${preview.packageName}）`, "yellow");
  for (const file of preview.files) {
    log(`  ${file.path} (${file.bytes} bytes)`);
  }
};

const runWrite = async (raw, rootDir, dryRun) => {
  const preview = previewScaffold(raw, rootDir);
  if (dryRun) {
    printPreview(preview);
    return preview;
  }
  const result = await createScaffold(raw, preview.fingerprint, rootDir);
  log(`\n✓ 已创建 ${result.targetDir}`, "green");
  for (const step of result.nextSteps) {
    if (step.command) {
      log(`  ${step.title}: ${step.command}`, "yellow");
    } else {
      log(`  ${step.title}`, "yellow");
    }
  }
  return result;
};

const interactiveApp = async (rl, positional) => {
  const rawName = positional[0] || (await question(rl, "App 名称 (kebab-case，如 acme-admin): "));
  const portInput = (await question(rl, "开发端口 [5800]: ")).trim() || "5800";
  const titleInput = (await question(rl, `标题 [${rawName}]: `)).trim();
  log(`官方插件（默认全选）: ${OFFICIAL_PLUGINS.map((plugin) => plugin.id).join(", ")}`, "yellow");
  const pluginInput = (
    await question(rl, `勾选官方插件 ID，逗号分隔，空则全选，none 则不选: `)
  )
    .trim()
    .toLowerCase();
  const withDemo = ((await question(rl, "是否生成 Demo 页? (Y/n): ")).trim().toLowerCase() || "y") !== "n";
  const officialPluginIds =
    pluginInput === "none"
      ? []
      : pluginInput
        ? pluginInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;
  return {
    version: 1,
    kind: "app",
    options: {
      appCode: rawName,
      withDemo,
      officialPluginIds,
      dev: { port: Number(portInput), host: "localhost", enableDevTools: true },
      env: titleInput ? { common: { VITE_APP_TITLE: titleInput } } : undefined,
    },
  };
};

const interactivePlugin = async (rl, positional) => {
  const directoryId = positional[0] || (await question(rl, "插件目录 (kebab-case): "));
  const withDemo = ((await question(rl, "是否生成 Demo? (Y/n): ")).trim().toLowerCase() || "y") !== "n";
  return { version: 1, kind: "plugin", options: { directoryId, withDemo } };
};

const interactiveTheme = async (rl, positional) => {
  const id = positional[0] || (await question(rl, "主题 ID (kebab-case): "));
  const name = (await question(rl, `展示名 [${id}]: `)).trim() || id;
  const shell = ((await question(rl, "是否生成 Shell 示例? (y/N): ")).trim().toLowerCase() || "n") === "y";
  return { version: 1, kind: "theme", options: { id, name, shell } };
};

export const runScaffoldCli = async ({ kind, argv, rootDir }) => {
  const args = parseArgs(argv);
  if (args.config && args.positional.length > 0) {
    throw new ScaffoldError("不能同时使用位置参数和 --config", { code: "VALIDATION_ERROR" });
  }
  if (args.config) {
    const raw = readConfigFile(args.config, kind);
    const normalized = normalizeRequest(raw);
    if (normalized.kind !== kind) {
      throw new ScaffoldError("配置 kind 与命令不匹配", { code: "VALIDATION_ERROR" });
    }
    await runWrite(raw, rootDir, args.dryRun);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const raw =
      kind === "plugin"
        ? await interactivePlugin(rl, args.positional)
        : kind === "theme"
          ? await interactiveTheme(rl, args.positional)
          : await interactiveApp(rl, args.positional);
    await runWrite(raw, rootDir, args.dryRun);
  } finally {
    rl.close();
  }
};
