import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  checkBoundaries,
  discoverWorkspacePackages,
  importSpecifiers,
} from "./check-boundaries.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const legalFixture = path.join(repoRoot, "scripts/fixtures/boundaries/legal-workspace");
const extraThemeFixture = path.join(repoRoot, "scripts/fixtures/boundaries/extra-theme");

const makeTempWorkspace = (prefix = "ingot-boundaries-") => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.cpSync(legalFixture, rootDir, { recursive: true });
  return rootDir;
};

const readPkg = (rootDir, relativePath) =>
  JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));

const writePkg = (rootDir, relativePath, pkg) => {
  fs.writeFileSync(path.join(rootDir, relativePath), `${JSON.stringify(pkg, null, 2)}\n`);
};

const addDep = (rootDir, relativePath, name, section = "dependencies") => {
  const pkg = readPkg(rootDir, relativePath);
  pkg[section] = { ...(pkg[section] ?? {}), [name]: "workspace:*" };
  writePkg(rootDir, relativePath, pkg);
};

const writeSource = (rootDir, relativePath, source) => {
  const abs = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, source);
};

const addExtraTheme = (rootDir) => {
  fs.cpSync(extraThemeFixture, path.join(rootDir, "themes/other"), { recursive: true });
};

const assertHasError = (errors, fragment) => {
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `期望包含「${fragment}」，实际：\n${errors.map((error) => `- ${error}`).join("\n") || "(无错误)"}`,
  );
};

test("importSpecifiers 识别静态、副作用、export-from 与字面量动态导入", () => {
  const specifiers = importSpecifiers(`
    import { a } from "@ingot/theme-demo";
    import "@ingot/theme-other/style.css";
    export { b } from "@ingot/admin-core";
    export * from "@ingot/demo-plugin";
    const mod = await import("@ingot/demo-app");
  `);
  assert.deepEqual(
    [...specifiers].sort(),
    [
      "@ingot/admin-core",
      "@ingot/demo-app",
      "@ingot/demo-plugin",
      "@ingot/theme-demo",
      "@ingot/theme-other/style.css",
    ].sort(),
  );
});

test("真实仓库边界检查通过", () => {
  const { errors } = checkBoundaries(repoRoot);
  assert.deepEqual(errors, []);
});

test("空 themes 时合法 apps/plugins/packages 通过", () => {
  const rootDir = makeTempWorkspace();
  try {
    fs.rmSync(path.join(rootDir, "themes"), { recursive: true, force: true });
    const appPkg = readPkg(rootDir, "apps/demo-app/package.json");
    delete appPkg.dependencies["@ingot/theme-demo"];
    writePkg(rootDir, "apps/demo-app/package.json", appPkg);
    writeSource(
      rootDir,
      "apps/demo-app/src/main.ts",
      `import { demoPlugin } from "@ingot/demo-plugin";\nvoid demoPlugin;\n`,
    );
    const { errors, workspacePackages } = checkBoundaries(rootDir);
    assert.deepEqual(errors, []);
    assert.equal(workspacePackages.filter((item) => item.layer === "themes").length, 0);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("单个主题被自动发现且合法 apps → themes → packages 通过", () => {
  const rootDir = makeTempWorkspace();
  try {
    const { errors, workspacePackages } = checkBoundaries(rootDir);
    assert.deepEqual(errors, []);
    assert.ok(workspacePackages.some((item) => item.name === "@ingot/theme-demo"));
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("多个主题被自动发现，无需包名白名单", () => {
  const rootDir = makeTempWorkspace();
  try {
    addExtraTheme(rootDir);
    const { errors, workspacePackages } = checkBoundaries(rootDir);
    assert.deepEqual(errors, []);
    assert.deepEqual(
      workspacePackages
        .filter((item) => item.layer === "themes")
        .map((item) => item.name)
        .sort(),
      ["@ingot/theme-demo", "@ingot/theme-other"],
    );
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("discoverWorkspacePackages 覆盖四类目录", () => {
  const rootDir = makeTempWorkspace();
  try {
    addExtraTheme(rootDir);
    const names = discoverWorkspacePackages(rootDir)
      .map((item) => `${item.layer}:${item.name}`)
      .sort();
    assert.deepEqual(names, [
      "apps:@ingot/demo-app",
      "packages:@ingot/admin-core",
      "plugins:@ingot/demo-plugin",
      "themes:@ingot/theme-demo",
      "themes:@ingot/theme-other",
    ]);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题不得依赖 App（manifest）", () => {
  const rootDir = makeTempWorkspace();
  try {
    addDep(rootDir, "themes/demo/package.json", "@ingot/demo-app");
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "@ingot/theme-demo 不得依赖 @ingot/demo-app");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题不得依赖插件（包名导入）", () => {
  const rootDir = makeTempWorkspace();
  try {
    writeSource(
      rootDir,
      "themes/demo/src/plugin-import.ts",
      `import { demoPlugin } from "@ingot/demo-plugin";\nvoid demoPlugin;\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "不得导入 @ingot/demo-plugin");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题不得依赖另一主题（副作用导入）", () => {
  const rootDir = makeTempWorkspace();
  try {
    addExtraTheme(rootDir);
    writeSource(
      rootDir,
      "themes/demo/src/other.css.ts",
      `import "@ingot/theme-other/style.css";\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "不得导入另一主题 @ingot/theme-other");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题不得通过相对路径导入另一主题", () => {
  const rootDir = makeTempWorkspace();
  try {
    addExtraTheme(rootDir);
    writeSource(
      rootDir,
      "themes/demo/src/relative-other.ts",
      `export { otherTheme } from "../../other/src/index.ts";\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "不得通过相对路径导入另一主题");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("packages 不得依赖主题（peerDependencies）", () => {
  const rootDir = makeTempWorkspace();
  try {
    addDep(rootDir, "packages/admin-core/package.json", "@ingot/theme-demo", "peerDependencies");
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "@ingot/admin-core 不得依赖 @ingot/theme-demo");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("plugins 不得依赖主题（optionalDependencies 与动态导入）", () => {
  const rootDir = makeTempWorkspace();
  try {
    addDep(
      rootDir,
      "plugins/demo-plugin/package.json",
      "@ingot/theme-demo",
      "optionalDependencies",
    );
    writeSource(
      rootDir,
      "plugins/demo-plugin/src/load-theme.ts",
      `export const load = () => import("@ingot/theme-demo");\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "@ingot/demo-plugin 不得依赖 @ingot/theme-demo");
    assertHasError(errors, "不得导入 @ingot/theme-demo");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题相对导入 App 源码应失败", () => {
  const rootDir = makeTempWorkspace();
  try {
    writeSource(
      rootDir,
      "themes/demo/src/app-relative.ts",
      `import { demoPlugin } from "../../../apps/demo-app/src/main.ts";\nvoid demoPlugin;\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "不得通过相对路径导入 @ingot/demo-app");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题绕过公共包 exports 导入 core 内部路径应失败", () => {
  const rootDir = makeTempWorkspace();
  try {
    writeSource(
      rootDir,
      "themes/demo/src/core-internal.ts",
      `export { coreInternalToken } from "@ingot/admin-core/src/internal";\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(
      errors,
      "不得绕过 @ingot/admin-core 的公开 exports 导入 @ingot/admin-core/src/internal",
    );
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("主题使用 @/ 别名应失败", () => {
  const rootDir = makeTempWorkspace();
  try {
    writeSource(
      rootDir,
      "themes/demo/src/alias.ts",
      `import { demoTheme } from "@/theme";\nvoid demoTheme;\n`,
    );
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "不得使用 @/ 别名");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("devDependencies 声明非法主题依赖应失败", () => {
  const rootDir = makeTempWorkspace();
  try {
    addDep(rootDir, "plugins/demo-plugin/package.json", "@ingot/theme-demo", "devDependencies");
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "@ingot/demo-plugin 不得依赖 @ingot/theme-demo");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("App 依赖自定义插件但未注册应失败", () => {
  const rootDir = makeTempWorkspace();
  try {
    writeSource(rootDir, "apps/demo-app/src/main.ts", `export const ready = true;\n`);
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "依赖了 @ingot/demo-plugin");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("App 注册自定义插件但未声明依赖应失败", () => {
  const rootDir = makeTempWorkspace();
  try {
    const pkg = readPkg(rootDir, "apps/demo-app/package.json");
    delete pkg.dependencies["@ingot/demo-plugin"];
    writePkg(rootDir, "apps/demo-app/package.json", pkg);
    const { errors } = checkBoundaries(rootDir);
    assertHasError(errors, "导入了 @ingot/demo-plugin");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
