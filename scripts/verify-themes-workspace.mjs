#!/usr/bin/env node

/**
 * 在隔离临时目录构建最小主题，并由最小 App 消费产物。
 * 验证 JS / 声明 / CSS / 资源、peer external，以及未选择主题不进入 App 模块图。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const fixtureRoot = path.join(rootDir, "scripts/fixtures/themes-workspace");

const run = (command, cwd = rootDir) => {
  console.log(`\n> ${command}`);
  execSync(command, { cwd, stdio: "inherit", env: process.env });
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const collectFiles = (dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
      continue;
    }
    results.push(fullPath);
  }
  return results;
};

const readJoined = (files) => files.map((file) => fs.readFileSync(file, "utf8")).join("\n");

const resolveExisting = (candidates) => candidates.find((candidate) => fs.existsSync(candidate));

const writeThemeTsconfig = (themeDir, adminCoreDts, vueDir) => {
  fs.writeFileSync(
    path.join(themeDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        include: ["src/**/*"],
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          skipLibCheck: true,
          jsx: "preserve",
          lib: ["ES2022", "DOM"],
          types: ["vite/client"],
          rootDir: "./src",
          outDir: "dist",
          declaration: true,
          emitDeclarationOnly: true,
          noEmit: false,
          paths: {
            "@ingot/admin-core": [adminCoreDts],
            vue: [vueDir],
          },
        },
      },
      null,
      2,
    )}\n`,
  );
};

const writeThemeViteConfig = (themeDir, adminCoreEntry) => {
  fs.writeFileSync(
    path.join(themeDir, "vite.config.ts"),
    `import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [vue()],
  resolve: {
    alias: {
      "@ingot/admin-core": ${JSON.stringify(adminCoreEntry)},
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: path.resolve(rootDir, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    assetsInlineLimit: 0,
    rollupOptions: {
      external: ["vue", "@ingot/admin-core", /^@ingot\\/admin-core(?:\\/|$)/],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "style.css";
          }
          return assetInfo.name ?? "asset";
        },
      },
    },
  },
});
`,
  );
};

const writeConsumerViteConfig = (consumerDir, auroraDir, nebulaDir) => {
  fs.writeFileSync(
    path.join(consumerDir, "vite.config.ts"),
    `import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: [
      {
        find: /^@ingot\\/theme-fixture-aurora\\/style\\.css$/,
        replacement: ${JSON.stringify(path.join(auroraDir, "dist/style.css"))},
      },
      {
        find: /^@ingot\\/theme-fixture-aurora$/,
        replacement: ${JSON.stringify(path.join(auroraDir, "dist/index.js"))},
      },
      {
        find: /^@ingot\\/theme-fixture-nebula\\/style\\.css$/,
        replacement: ${JSON.stringify(path.join(nebulaDir, "dist/style.css"))},
      },
      {
        find: /^@ingot\\/theme-fixture-nebula$/,
        replacement: ${JSON.stringify(path.join(nebulaDir, "dist/index.js"))},
      },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: {
      external: ["vue", "@ingot/admin-core", /^@ingot\\/admin-core(?:\\/|$)/],
    },
    rollupOptions: {
      external: ["vue", "@ingot/admin-core", /^@ingot\\/admin-core(?:\\/|$)/],
    },
  },
});
`,
  );
};

const buildTheme = (themeDir, adminCoreDts, adminCoreEntry, vueDir) => {
  writeThemeTsconfig(themeDir, adminCoreDts, vueDir);
  writeThemeViteConfig(themeDir, adminCoreEntry);
  run(`pnpm exec vite build --config "${path.join(themeDir, "vite.config.ts")}"`);
  run(`pnpm exec vue-tsc -p "${path.join(themeDir, "tsconfig.json")}"`);
};

const main = () => {
  const adminCoreDts = path.join(rootDir, "packages/admin-core/dist/index.d.ts");
  const adminCoreEntry = path.join(rootDir, "packages/admin-core/dist/index.js");
  if (!fs.existsSync(adminCoreDts) || !fs.existsSync(adminCoreEntry)) {
    run("pnpm --filter @ingot/admin-core build");
  }
  assert(fs.existsSync(adminCoreDts), "缺少 @ingot/admin-core 声明产物");
  assert(fs.existsSync(adminCoreEntry), "缺少 @ingot/admin-core 构建产物");

  const vueDir = resolveExisting([
    path.join(rootDir, "packages/admin-core/node_modules/vue"),
    path.join(rootDir, "plugins/platform/node_modules/vue"),
    path.join(rootDir, "apps/admin/node_modules/vue"),
  ]);
  assert(vueDir, "找不到 vue，无法为临时主题生成类型路径");

  const workDir = path.join(
    rootDir,
    ".temp",
    `themes-workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  fs.mkdirSync(workDir, { recursive: true });
  const auroraDir = path.join(workDir, "themes/fixture-aurora");
  const nebulaDir = path.join(workDir, "themes/fixture-nebula");
  const consumerDir = path.join(workDir, "apps/consumer");

  try {
    fs.cpSync(path.join(fixtureRoot, "selected-theme"), auroraDir, { recursive: true });
    fs.cpSync(path.join(fixtureRoot, "unused-theme"), nebulaDir, { recursive: true });
    fs.cpSync(path.join(fixtureRoot, "consumer-app"), consumerDir, { recursive: true });

    console.log(`\n临时工作区: ${workDir}`);
    buildTheme(auroraDir, adminCoreDts, adminCoreEntry, vueDir);
    buildTheme(nebulaDir, adminCoreDts, adminCoreEntry, vueDir);

    const auroraJs = path.join(auroraDir, "dist/index.js");
    const auroraCss = path.join(auroraDir, "dist/style.css");
    const auroraDts = path.join(auroraDir, "dist/index.d.ts");
    assert(fs.existsSync(auroraJs), "选中主题缺少 dist/index.js");
    assert(fs.existsSync(auroraCss), "选中主题缺少 dist/style.css");
    assert(fs.existsSync(auroraDts), "选中主题缺少 dist/index.d.ts");

    const bundled = fs.readFileSync(auroraJs, "utf8");
    const auroraAssets = collectFiles(path.join(auroraDir, "dist"));
    const hasSvgFile = auroraAssets.some((file) => file.endsWith(".svg"));
    assert(
      hasSvgFile ||
        bundled.includes("image/svg") ||
        bundled.includes("<svg") ||
        bundled.includes("mark.svg"),
      "选中主题产物缺少 SVG 资源",
    );
    assert(bundled.includes("@ingot/admin-core"), "产物应把 admin-core 留作外部依赖");
    assert(!bundled.includes("node_modules/vue/dist/vue"), "产物打进了 Vue 运行时");
    assert(!bundled.includes("@ingot/admin-core/src"), "产物引用了 admin-core 源码路径");
    assert(!bundled.includes("@/"), "产物引用了 @/ 别名");

    const css = fs.readFileSync(auroraCss, "utf8");
    assert(
      css.includes("data-in-theme=fixture-aurora") ||
        css.includes('data-in-theme="fixture-aurora"'),
      "CSS 缺少主题作用域",
    );

    const dts = fs.readFileSync(auroraDts, "utf8");
    assert(dts.includes("fixtureAuroraTheme"), "声明文件未导出主题");

    assert(fs.existsSync(path.join(nebulaDir, "dist/index.js")), "未选主题也应能独立构建");
    assert(
      fs
        .readFileSync(path.join(nebulaDir, "dist/index.js"), "utf8")
        .includes("fixture-nebula-unique-marker"),
      "未选主题产物应包含可识别标记",
    );

    writeConsumerViteConfig(consumerDir, auroraDir, nebulaDir);
    run(`pnpm exec vite build --config "${path.join(consumerDir, "vite.config.ts")}"`);

    const consumerFiles = collectFiles(path.join(consumerDir, "dist"));
    assert(consumerFiles.length > 0, "消费 App 没有构建产物");
    const consumerText = readJoined(consumerFiles);
    assert(consumerText.includes("fixture-aurora"), "消费 App 未包含选中主题");
    assert(
      consumerText.includes("data-in-theme=fixture-aurora") ||
        consumerText.includes('data-in-theme="fixture-aurora"'),
      "消费 App 未包含选中主题 CSS",
    );
    assert(!consumerText.includes("fixture-nebula-unique-marker"), "未选择的主题进入了 App 模块图");
    assert(!consumerText.includes("fixture-nebula"), "未选择的主题 ID 出现在 App 产物中");
    assert(
      !consumerText.includes("@ingot/theme-fixture-nebula"),
      "未选择的主题包名出现在 App 产物中",
    );

    console.log("\n✓ 隔离主题 workspace 构建与消费验证通过");
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
