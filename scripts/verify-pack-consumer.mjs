#!/usr/bin/env node

/**
 * 将 admin-core / admin-base / vite-config（及 workspace 依赖）pnpm pack 后，
 * 在临时目录安装并执行 type-check + production build，验证发布产物可独立消费。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PACKAGES = [
  "@ingot/utils",
  "@ingot/hooks",
  "@ingot/crypto",
  "@ingot/vite-config",
  "@ingot/admin-core",
  "@ingot/admin-base",
];

const run = (command, cwd = rootDir) => {
  console.log(`\n> ${command}`);
  execSync(command, { cwd, stdio: "inherit", env: process.env });
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const assertNoWorkspaceProtocols = (pkgJson, tarballName) => {
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  for (const section of sections) {
    const deps = pkgJson[section] ?? {};
    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === "string" && (version.startsWith("workspace:") || version.startsWith("catalog:"))) {
        throw new Error(`${tarballName} 的 ${section}.${name} 仍为协议版本: ${version}`);
      }
    }
  }
};

const main = () => {
  run("pnpm build:packages");

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-pack-"));
  const packsDir = path.join(workDir, "packs");
  const consumerDir = path.join(workDir, "consumer");
  fs.mkdirSync(packsDir);
  fs.mkdirSync(consumerDir);

  console.log(`\n工作目录: ${workDir}`);

  const tarballByName = new Map();
  for (const filter of PACKAGES) {
    const output = execSync(`pnpm --filter ${filter} pack --pack-destination "${packsDir}"`, {
      cwd: rootDir,
      encoding: "utf8",
    });
    const match = output.match(/[\w@/.-]+\.tgz/);
    if (!match) {
      throw new Error(`未能解析 ${filter} 的 pack 输出:\n${output}`);
    }
    const tarballPath = path.join(packsDir, path.basename(match[0]));
    if (!fs.existsSync(tarballPath)) {
      // pnpm 有时打印绝对路径
      const abs = output
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.endsWith(".tgz") && fs.existsSync(line));
      if (!abs) {
        throw new Error(`找不到 tarball: ${filter}`);
      }
      tarballByName.set(filter, abs);
    } else {
      tarballByName.set(filter, tarballPath);
    }
  }

  for (const [name, tarball] of tarballByName) {
    const extractDir = path.join(packsDir, name.replace("@", "").replace("/", "-"));
    fs.mkdirSync(extractDir, { recursive: true });
    run(`tar -xzf "${tarball}" -C "${extractDir}"`);
    const pkgJson = readJson(path.join(extractDir, "package", "package.json"));
    assertNoWorkspaceProtocols(pkgJson, name);
    console.log(`✓ ${name} manifest 无 catalog:/workspace:`);
  }

  // 未发布到 npm 的 @ingot/* 一律用本地 tarball，避免被解析到 registry
  const localIngotDeps = Object.fromEntries(
    [...tarballByName.entries()].map(([name, tarball]) => [name, `file:${tarball}`]),
  );

  const consumerPkg = {
    name: "ingot-pack-consumer",
    private: true,
    type: "module",
    scripts: {
      "type-check": "vue-tsc --noEmit",
      build: "vite build",
    },
    dependencies: {
      ...localIngotDeps,
      "@vue/shared": "3.5.42",
      "@vueuse/core": "14.4.0",
      "element-plus": "2.14.5",
      pinia: "4.0.3",
      "pinia-plugin-persistedstate": "4.7.1",
      vue: "3.5.42",
      "vue-router": "5.3.0",
    },
    devDependencies: {
      "@vitejs/plugin-vue": "6.0.8",
      "@vitejs/plugin-vue-jsx": "5.1.6",
      postcss: "8.5.26",
      "postcss-nesting": "14.0.1",
      typescript: "6.0.3",
      unocss: "66.8.1",
      "unplugin-auto-import": "21.1.0",
      "unplugin-icons": "23.0.1",
      "unplugin-vue-components": "32.1.0",
      vite: "8.2.2",
      "vite-plugin-svg-icons": "2.0.1",
      "vite-plugin-vue-devtools": "8.2.1",
      "vue-tsc": "3.3.11",
    },
    pnpm: {
      overrides: localIngotDeps,
    },
  };
  fs.writeFileSync(path.join(consumerDir, "package.json"), `${JSON.stringify(consumerPkg, null, 2)}\n`);

  fs.writeFileSync(
    path.join(consumerDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          jsx: "preserve",
          skipLibCheck: true,
          resolveJsonModule: true,
          isolatedModules: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          types: ["vite/client"],
        },
        include: ["src/**/*.ts", "src/**/*.vue", "env.d.ts"],
      },
      null,
      2,
    )}\n`,
  );

  fs.writeFileSync(
    path.join(consumerDir, "env.d.ts"),
    `/// <reference types="vite/client" />\n`,
  );

  fs.writeFileSync(
    path.join(consumerDir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: false,
  },
});
`,
  );

  fs.writeFileSync(
    path.join(consumerDir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>pack consumer</title></head>
  <body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`,
  );

  fs.mkdirSync(path.join(consumerDir, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(consumerDir, "src/main.ts"),
    `import { bootstrapAdminApp } from "@ingot/admin-core";
import { adminBasePlugin } from "@ingot/admin-base";
import "@ingot/admin-core/style.css";
import "@ingot/admin-base/style.css";

void bootstrapAdminApp({
  appCode: "pack-consumer",
  plugins: [adminBasePlugin],
  branding: { title: "Pack Consumer" },
  login: {
    loginUri: "/login",
    callbackUri: "/",
    fingerprintEnabled: false,
  },
});
`,
  );

  run("pnpm install", consumerDir);
  run("pnpm type-check", consumerDir);
  run("pnpm build", consumerDir);

  console.log("\n✓ 隔离消费验证通过");
  console.log(`临时目录可手动检查: ${workDir}`);
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
