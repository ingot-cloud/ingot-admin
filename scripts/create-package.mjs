#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// 模板内容
const templates = {
  packageJson: (packageName, description) => ({
    name: `@ingot/${packageName}`,
    version: "1.0.0",
    description: description || "",
    main: "dist/index.js",
    types: "dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/index.js",
      },
    },
    scripts: {
      build: "tsc",
      dev: "tsc --watch",
      clean: "rimraf node_modules dist",
      test: 'echo "Error: no test specified" && exit 1',
    },
    keywords: [],
    author: "",
    license: "ISC",
    packageManager: "pnpm@10.12.4",
    dependencies: {},
    devDependencies: {},
  }),

  tsconfig: () => ({
    extends: "../.././tsconfig.base.json",
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "**/*.test.*", "**/*.spec.*"],
    compilerOptions: {
      rootDir: "src",
      outDir: "dist",
      declaration: true,
      declarationDir: "dist",
      declarationMap: true,
      sourceMap: true,
      composite: true,
      emitDeclarationOnly: false,
      noEmit: false,
      tsBuildInfoFile: "dist/tsconfig.tsbuildinfo",
    },
  }),

  tsconfigEslint: () => ({
    extends: "./tsconfig.json",
    include: ["src/**/*", "eslint.config.ts"],
  }),

  eslintConfig: () => `import baseConfig from '../../eslint.config.base';

export default [...baseConfig];
`,

  indexTs: (packageName) => `/**
 * @ingot/${packageName}
 *
 * 这是一个自动生成的包
 */

export function hello() {
  return 'Hello from @ingot/${packageName}';
}
`,

  readme: (packageName, description) => `# @ingot/${packageName}

${description || ""}

## 安装

\`\`\`bash
pnpm add @ingot/${packageName}
\`\`\`

## 使用

\`\`\`typescript
import { hello } from '@ingot/${packageName}';

console.log(hello());
\`\`\`

## 开发

\`\`\`bash
# 构建
pnpm build

# 监听模式
pnpm dev

# 清理
pnpm clean
\`\`\`
`,
};

// 创建 package
async function createPackage(packageName, description) {
  const packageDir = path.join(rootDir, "packages", packageName);

  // 检查目录是否已存在
  if (fs.existsSync(packageDir)) {
    log(`❌ 错误: packages/${packageName} 目录已存在`, "red");
    return false;
  }

  log(`\n📦 正在创建 package: @ingot/${packageName}...`, "blue");

  try {
    // 1. 创建目录结构
    log("  - 创建目录结构...", "yellow");
    fs.mkdirSync(path.join(packageDir, "src"), { recursive: true });

    // 2. 创建 package.json
    log("  - 创建 package.json...", "yellow");
    fs.writeFileSync(
      path.join(packageDir, "package.json"),
      JSON.stringify(templates.packageJson(packageName, description), null, 2) + "\n",
    );

    // 3. 创建 tsconfig.json
    log("  - 创建 tsconfig.json...", "yellow");
    fs.writeFileSync(
      path.join(packageDir, "tsconfig.json"),
      JSON.stringify(templates.tsconfig(), null, 2) + "\n",
    );

    // 4. 创建 tsconfig.eslint.json
    log("  - 创建 tsconfig.eslint.json...", "yellow");
    fs.writeFileSync(
      path.join(packageDir, "tsconfig.eslint.json"),
      JSON.stringify(templates.tsconfigEslint(), null, 2) + "\n",
    );

    // 5. 创建 eslint.config.ts
    log("  - 创建 eslint.config.ts...", "yellow");
    fs.writeFileSync(path.join(packageDir, "eslint.config.ts"), templates.eslintConfig());

    // 6. 创建 src/index.ts
    log("  - 创建 src/index.ts...", "yellow");
    fs.writeFileSync(path.join(packageDir, "src", "index.ts"), templates.indexTs(packageName));

    // 7. 创建 README.md
    log("  - 创建 README.md...", "yellow");
    fs.writeFileSync(
      path.join(packageDir, "README.md"),
      templates.readme(packageName, description),
    );

    log(`\n✅ Package 创建成功！`, "green");
    log(`\n📝 接下来需要手动完成以下配置：\n`, "blue");

    // 提供后续配置说明
    log("1. 更新 tsconfig.vue-base.json，添加路径映射：", "yellow");
    log(`   "@ingot/${packageName}": ["../../packages/${packageName}/src/index.ts"]`, "reset");

    log(
      "\n2. 更新 apps/ingot-admin/vite.config.ts 和 apps/ingot-login/vite.config.ts，添加别名：",
      "yellow",
    );
    log(`   "@ingot/${packageName}": fileURLToPath(`, "reset");
    log(`     new URL("../../packages/${packageName}/src/index.ts", import.meta.url)`, "reset");
    log(`   )`, "reset");

    log("\n3. 在需要使用的应用的 package.json 中添加依赖：", "yellow");
    log(`   "@ingot/${packageName}": "workspace:*"`, "reset");

    log("\n4. 安装依赖并构建：", "yellow");
    log(`   pnpm install`, "reset");
    log(`   pnpm --filter @ingot/${packageName} build`, "reset");

    log("\n💡 提示：你可以运行以下命令来自动更新配置文件：", "blue");
    log(`   pnpm create:package:config ${packageName}`, "reset");

    return true;
  } catch (error) {
    log(`\n❌ 创建失败: ${error.message}`, "red");
    return false;
  }
}

// 自动更新配置文件
async function updateConfigs(packageName) {
  log(`\n🔧 正在更新配置文件...`, "blue");

  try {
    // 1. 更新根目录 tsconfig.json 的 references
    log("  - 更新根目录 tsconfig.json...", "yellow");
    const rootTsconfigPath = path.join(rootDir, "tsconfig.json");
    const rootTsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, "utf-8"));

    const newReference = { path: `./packages/${packageName}` };
    const referenceExists = rootTsconfig.references.some((ref) => ref.path === newReference.path);

    if (!referenceExists) {
      rootTsconfig.references.push(newReference);
      fs.writeFileSync(rootTsconfigPath, JSON.stringify(rootTsconfig, null, 2) + "\n");
      log("    ✓ tsconfig.json 已更新", "green");
    } else {
      log("    ⊙ tsconfig.json 已包含该配置", "yellow");
    }

    // 2. 更新 tsconfig.vue-base.json
    log("  - 更新 tsconfig.vue-base.json...", "yellow");
    const tsconfigVueBasePath = path.join(rootDir, "tsconfig.vue-base.json");
    const tsconfigVueBase = JSON.parse(fs.readFileSync(tsconfigVueBasePath, "utf-8"));

    if (!tsconfigVueBase.compilerOptions.paths[`@ingot/${packageName}`]) {
      tsconfigVueBase.compilerOptions.paths[`@ingot/${packageName}`] = [
        `../../packages/${packageName}/src/index.ts`,
      ];
      fs.writeFileSync(tsconfigVueBasePath, JSON.stringify(tsconfigVueBase, null, 2) + "\n");
      log("    ✓ tsconfig.vue-base.json 已更新", "green");
    } else {
      log("    ⊙ tsconfig.vue-base.json 已包含该配置", "yellow");
    }

    // 3. 更新 Vite 配置文件
    const viteConfigs = ["apps/ingot-admin/vite.config.ts", "apps/ingot-login/vite.config.ts"];

    for (const viteConfigPath of viteConfigs) {
      log(`  - 更新 ${viteConfigPath}...`, "yellow");
      const fullPath = path.join(rootDir, viteConfigPath);
      let content = fs.readFileSync(fullPath, "utf-8");

      // 检查是否已经存在该别名
      if (content.includes(`@ingot/${packageName}`)) {
        log(`    ⊙ ${viteConfigPath} 已包含该配置`, "yellow");
        continue;
      }

      // 找到 resolve.alias 块，并在最后一个 @ingot 别名后面插入
      // 策略：找到最后一个 "@ingot/ 开头的行，然后向下查找它对应的结束 ),

      // 查找所有 "@ingot/ 别名的起始位置
      const ingotLines = [];
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('"@ingot/')) {
          ingotLines.push(i);
        }
      }

      if (ingotLines.length > 0) {
        // 获取最后一个 @ingot 别名的行号
        const lastIngotLineIndex = ingotLines[ingotLines.length - 1];

        // 从这一行开始向下查找对应的 ), 结束位置
        let endLineIndex = lastIngotLineIndex + 1;
        let foundEnd = false;

        // 查找包含 ), 的行（注意缩进应该是8个空格）
        while (endLineIndex < lines.length) {
          const line = lines[endLineIndex];
          // 匹配8个空格+), 的模式
          if (/^\s{8}\),\s*$/.test(line)) {
            foundEnd = true;
            break;
          }
          endLineIndex++;
        }

        if (foundEnd) {
          // 确定相对路径的深度
          const depth = viteConfigPath.split("/").length - 1;
          const relativePath = "../".repeat(depth);

          // 在找到的行后面插入新的别名
          const newAlias = `        "@ingot/${packageName}": fileURLToPath(
          new URL("${relativePath}packages/${packageName}/src/index.ts", import.meta.url),
        ),`;

          lines.splice(endLineIndex + 1, 0, newAlias);
          content = lines.join("\n");

          fs.writeFileSync(fullPath, content);
          log(`    ✓ ${viteConfigPath} 已更新`, "green");
        } else {
          log(`    ⚠ 无法找到 @ingot 别名的结束位置，请手动添加`, "red");
        }
      } else {
        log(`    ⚠ 无法找到 @ingot 别名，请手动添加`, "red");
      }
    }

    log("\n✅ 配置文件更新完成！", "green");
    log("\n📝 提示：记得在需要使用的应用的 package.json 中添加依赖", "blue");
    log(`   "@ingot/${packageName}": "workspace:*"`, "reset");

    return true;
  } catch (error) {
    log(`\n❌ 更新配置失败: ${error.message}`, "red");
    return false;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "config") {
    // 只更新配置
    const packageName = args[1];
    if (!packageName) {
      log("❌ 错误: 请提供 package 名称", "red");
      log("用法: pnpm create:package:config <package-name>", "yellow");
      rl.close();
      process.exit(1);
    }

    const packageDir = path.join(rootDir, "packages", packageName);
    if (!fs.existsSync(packageDir)) {
      log(`❌ 错误: packages/${packageName} 不存在`, "red");
      rl.close();
      process.exit(1);
    }

    await updateConfigs(packageName);
    rl.close();
    return;
  }

  // 创建新 package
  log("🎉 欢迎使用 Ingot Package 创建工具\n", "green");

  let packageName = args[0];
  let description = args[1];

  // 如果没有提供参数，交互式询问
  if (!packageName) {
    packageName = await question("📦 请输入 package 名称（不含 @ingot/ 前缀）: ");
    packageName = packageName.trim();
  }

  if (!packageName) {
    log("❌ 错误: package 名称不能为空", "red");
    rl.close();
    process.exit(1);
  }

  // 验证包名格式（只允许字母、数字、连字符、下划线）
  if (!/^[a-z0-9-_]+$/.test(packageName)) {
    log("❌ 错误: package 名称只能包含小写字母、数字、连字符和下划线", "red");
    rl.close();
    process.exit(1);
  }

  if (!description) {
    description = await question("📝 请输入 package 描述（可选，直接回车跳过）: ");
    description = description.trim();
  }

  const success = await createPackage(packageName, description);

  if (success) {
    // 询问是否自动更新配置
    const autoUpdate = await question("\n是否自动更新配置文件？(y/n): ");
    if (autoUpdate.toLowerCase() === "y" || autoUpdate.toLowerCase() === "yes") {
      await updateConfigs(packageName);
    }
  }

  rl.close();
}

main().catch((error) => {
  log(`\n❌ 发生错误: ${error.message}`, "red");
  console.error(error);
  rl.close();
  process.exit(1);
});
