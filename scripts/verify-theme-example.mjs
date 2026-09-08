#!/usr/bin/env node

/**
 * 构建 examples/admin-theme 并验证打包产物可独立消费：
 * 不依赖消费端扫描源码、不引用 admin-core 私有路径、CSS 与类型随包交付。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const exampleDir = path.join(rootDir, "examples/admin-theme");

const run = (command, cwd = rootDir) => {
  console.log(`\n> ${command}`);
  execSync(command, { cwd, stdio: "inherit", env: process.env });
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = () => {
  const adminCoreDist = path.join(rootDir, "packages/admin-core/dist/index.d.ts");
  if (!fs.existsSync(adminCoreDist)) {
    run("pnpm --filter @ingot/admin-core build");
  }
  run("pnpm exec vite build --config examples/admin-theme/vite.config.ts");
  run("pnpm exec vue-tsc -p examples/admin-theme/tsconfig.build.json");

  const distJs = path.join(exampleDir, "dist/index.js");
  const distCss = path.join(exampleDir, "dist/style.css");
  const distDts = path.join(exampleDir, "dist/index.d.ts");
  assert(fs.existsSync(distJs), "缺少 dist/index.js");
  assert(fs.existsSync(distCss), "缺少 dist/style.css");
  assert(fs.existsSync(distDts), "缺少 dist/index.d.ts");

  const bundled = fs.readFileSync(distJs, "utf8");
  assert(!bundled.includes("@/layouts"), "产物引用了 admin-core 内部别名");
  assert(!bundled.includes("@ingot/admin-core/src"), "产物引用了 admin-core 源码路径");
  assert(!bundled.includes("node_modules/vue/dist/vue"), "产物打进了 Vue 运行时");
  assert(bundled.includes("@ingot/admin-core"), "产物应把 admin-core 留作外部依赖");

  const css = fs.readFileSync(distCss, "utf8");
  assert(
    css.includes("data-in-theme=example-horizon") || css.includes('data-in-theme="example-horizon"'),
    "CSS 缺少主题作用域",
  );
  assert(!/--in-[a-z-]+:/.test(css.replace(/var\(--in-[a-z-]+\)/g, "")), "附加 CSS 不应重定义公共 Token");

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-theme-consumer-"));
  const consumerDir = path.join(workDir, "consumer");
  fs.mkdirSync(path.join(consumerDir, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(consumerDir, "package.json"),
    `${JSON.stringify(
      {
        name: "theme-pack-consumer",
        private: true,
        type: "module",
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(consumerDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          lib: ["ES2022", "DOM"],
          paths: {
            "@ingot/example-admin-theme": [path.join(exampleDir, "dist/index.d.ts")],
            "@ingot/admin-core": [path.join(rootDir, "packages/admin-core/dist/index.d.ts")],
            vue: [path.join(rootDir, "plugins/platform/node_modules/vue")],
          },
        },
        include: ["src/**/*.ts"],
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(consumerDir, "src/main.ts"),
    `import { exampleHorizonTheme } from "@ingot/example-admin-theme";
import { defaultAdminTheme } from "@ingot/admin-core";

const id: string = exampleHorizonTheme.id;
void id;
void exampleHorizonTheme.shell;
void defaultAdminTheme.id;
`,
  );

  run(
    `pnpm exec vue-tsc -p "${path.join(consumerDir, "tsconfig.json")}" --noEmit`,
  );

  console.log("\n✓ 独立主题打包消费验证通过");
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
