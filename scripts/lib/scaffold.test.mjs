import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { IN_THEME_TOKEN_NAMES } from "./scaffold/constants.mjs";
import { parseEnvFile, serializeEnvFile } from "./scaffold/env.mjs";
import { createScaffold, previewScaffold } from "./scaffold/engine.mjs";
import { ScaffoldError } from "./scaffold/errors.mjs";
import { normalizeRequest } from "./scaffold/normalize.mjs";
import { writeExclusive } from "./scaffold/write.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const makeRoot = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-portal-"));
  fs.mkdirSync(path.join(rootDir, "apps"));
  fs.mkdirSync(path.join(rootDir, "plugins"));
  fs.mkdirSync(path.join(rootDir, "themes"));
  return rootDir;
};

test("Token 清单与 admin-core 公开名一致", () => {
  const source = fs.readFileSync(path.join(repoRoot, "packages/admin-core/src/theme/tokens.ts"), "utf8");
  const names = [...source.matchAll(/"(--in-[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual([...IN_THEME_TOKEN_NAMES], names);
});

test("默认值、mode 覆盖与空字符串语义", () => {
  const request = normalizeRequest({
    version: 1,
    kind: "app",
    options: {
      appCode: "AcmeAdmin",
      env: {
        common: { VITE_APP_TITLE: "Acme" },
        modes: { production: { VITE_APP_COOKIE_DOMAIN: "", VITE_APP_TITLE: "Prod" } },
      },
    },
  });
  assert.equal(request.options.appCode, "acme-admin");
  assert.equal(request.options.env.common.VITE_APP_CODE, "acme-admin");
  assert.equal(request.options.env.common.VITE_APP_TITLE, "Acme");
  assert.equal(request.options.env.modes.production.VITE_APP_COOKIE_DOMAIN, "");
  assert.equal(request.options.env.modes.production.VITE_APP_TITLE, "Prod");
});

test("env 转义后解析值不变", () => {
  const original = {
    VITE_APP_TITLE: `He said "hi"\npath=C:\\tmp $HOME`,
  };
  const parsed = parseEnvFile(serializeEnvFile(original));
  assert.equal(parsed.VITE_APP_TITLE, original.VITE_APP_TITLE);
});

test("非法枚举与版本错误", () => {
  assert.throws(
    () =>
      previewScaffold(
        {
          version: 1,
          kind: "app",
          options: { appCode: "demo-app", env: { common: { VITE_APP_SETTINGS_COMPONENT_SIZE: "huge" } } },
        },
        makeRoot(),
      ),
    (error) => error instanceof ScaffoldError && error.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () => previewScaffold({ version: 2, kind: "app", options: { appCode: "demo-app" } }, makeRoot()),
    (error) => error instanceof ScaffoldError && error.code === "UNSUPPORTED_VERSION",
  );
});

test("预览不写盘，摘要失效需重预览", async () => {
  const rootDir = makeRoot();
  const request = { version: 1, kind: "app", options: { appCode: "preview-app" } };
  const preview = previewScaffold(request, rootDir);
  assert.equal(fs.existsSync(path.join(rootDir, "apps/preview-app")), false);
  await assert.rejects(
    () => createScaffold(request, "deadbeef", rootDir),
    (error) => error instanceof ScaffoldError && error.code === "PREVIEW_STALE",
  );
  const created = await createScaffold(request, preview.fingerprint, rootDir);
  assert.equal(created.targetDir, "apps/preview-app");
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("目录逃逸、符号链接与重复创建", async () => {
  const rootDir = makeRoot();
  assert.throws(
    () => previewScaffold({ version: 1, kind: "app", options: { appCode: "../escape" } }, rootDir),
    (error) => error instanceof ScaffoldError,
  );
  const first = previewScaffold({ version: 1, kind: "plugin", options: { directoryId: "sales" } }, rootDir);
  await createScaffold({ version: 1, kind: "plugin", options: { directoryId: "sales" } }, first.fingerprint, rootDir);
  await assert.rejects(
    () => createScaffold({ version: 1, kind: "plugin", options: { directoryId: "sales" } }, first.fingerprint, rootDir),
    (error) => error instanceof ScaffoldError && error.code === "TARGET_EXISTS",
  );
  const link = path.join(rootDir, "plugins", "linked");
  fs.symlinkSync(path.join(rootDir, "apps"), link);
  assert.throws(
    () => previewScaffold({ version: 1, kind: "plugin", options: { directoryId: "linked" } }, rootDir),
    (error) => error instanceof ScaffoldError,
  );
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("失败回滚不会留下半成品，二进制与文本一致", () => {
  const rootDir = makeRoot();
  const preview = previewScaffold({ version: 1, kind: "app", options: { appCode: "bin-app" } }, rootDir);
  const files = preview.rendered.files.map((file) =>
    file.path === "package.json" ? { ...file, path: "../outside.json" } : file,
  );
  assert.throws(() => writeExclusive(path.join(rootDir, "apps/bin-app"), files));
  assert.equal(fs.existsSync(path.join(rootDir, "apps/bin-app")), false);
  const favicon = preview.rendered.files.find((file) => file.path.endsWith("favicon.ico"));
  assert.equal(favicon?.kind, "binary");
  assert.ok(favicon.buffer.byteLength > 0);
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("CLI 与 Web 同一输入输出一致", () => {
  const rootDir = makeRoot();
  const raw = { version: 1, kind: "theme", options: { id: "aurora", name: "极光" } };
  const left = previewScaffold(raw, rootDir);
  const right = previewScaffold(raw, rootDir);
  assert.equal(left.fingerprint, right.fingerprint);
  assert.deepEqual(
    left.files.map((file) => file.path),
    right.files.map((file) => file.path),
  );
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("默认 / 无插件 / 无 Demo / 多 mode 自定义变量", async () => {
  const rootDir = makeRoot();
  const defaultPreview = previewScaffold({ version: 1, kind: "app", options: { appCode: "default-app" } }, rootDir);
  assert.match(defaultPreview.rendered.files.find((file) => file.path === "src/plugins.ts").content, /platformPlugin/);
  assert.ok(defaultPreview.rendered.files.some((file) => file.path.startsWith("src/pages/demo/")));

  const emptyPlugins = previewScaffold(
    { version: 1, kind: "app", options: { appCode: "bare-app", plugins: [], withDemo: false } },
    rootDir,
  );
  const pluginsTs = emptyPlugins.rendered.files.find((file) => file.path === "src/plugins.ts").content;
  assert.doesNotMatch(pluginsTs, /platformPlugin/);
  assert.match(pluginsTs, /createAppLocalPlugin\(appCode\)/);
  assert.equal(
    emptyPlugins.rendered.files.some((file) => file.path.startsWith("src/pages/demo/")),
    false,
  );

  const multi = previewScaffold(
    {
      version: 1,
      kind: "app",
      options: {
        appCode: "multi-app",
        env: {
          common: { VITE_APP_TITLE: "公共标题", VITE_CUSTOM_FLAG: "base" },
          modes: {
            development: { VITE_CUSTOM_FLAG: "dev" },
            production: { VITE_APP_TITLE: "生产标题" },
            staging: { VITE_APP_NET_BASE_URL: "https://staging.example" },
          },
        },
      },
    },
    rootDir,
  );
  const envCommon = multi.rendered.files.find((file) => file.path === ".env").content;
  const envDev = multi.rendered.files.find((file) => file.path === ".env.development").content;
  const envProd = multi.rendered.files.find((file) => file.path === ".env.production").content;
  const envStaging = multi.rendered.files.find((file) => file.path === ".env.staging").content;
  assert.match(envCommon, /VITE_CUSTOM_FLAG=base/);
  assert.match(envDev, /VITE_CUSTOM_FLAG=dev/);
  assert.match(envProd, /VITE_APP_TITLE="生产标题"/);
  assert.match(envStaging, /VITE_APP_NET_BASE_URL=https:\/\/staging.example/);
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("并发创建同一目标不会互相覆盖", async () => {
  const rootDir = makeRoot();
  const request = { version: 1, kind: "app", options: { appCode: "race-app" } };
  const preview = previewScaffold(request, rootDir);
  const results = await Promise.allSettled([
    createScaffold(request, preview.fingerprint, rootDir),
    createScaffold(request, preview.fingerprint, rootDir),
  ]);
  const fulfilled = results.filter((item) => item.status === "fulfilled");
  const rejected = results.filter((item) => item.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  const error = rejected[0].reason;
  assert.equal(error instanceof ScaffoldError, true);
  assert.ok(error.code === "CREATE_IN_PROGRESS" || error.code === "TARGET_EXISTS");
  assert.equal(fs.existsSync(path.join(rootDir, "apps/race-app/package.json")), true);
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("隔离创建插件和主题后再生成选用二者的 App", async () => {
  const rootDir = makeRoot();
  const pluginReq = {
    version: 1,
    kind: "plugin",
    options: { directoryId: "sales", withDemo: false },
  };
  const pluginPreview = previewScaffold(pluginReq, rootDir);
  await createScaffold(pluginReq, pluginPreview.fingerprint, rootDir);

  const themeReq = {
    version: 1,
    kind: "theme",
    options: {
      id: "aurora",
      name: "极光",
      tokens: { light: { "--in-color-primary": "#135" }, dark: { "--in-color-primary": "#9cf" } },
      shell: true,
      parts: ["header"],
    },
  };
  const themePreview = previewScaffold(themeReq, rootDir);
  await createScaffold(themeReq, themePreview.fingerprint, rootDir);

  const appReq = {
    version: 1,
    kind: "app",
    options: {
      appCode: "combo-admin",
      plugins: [{ packageName: "@ingot/sales-plugin", exportName: "salesPlugin" }],
      theme: { kind: "workspace", packageName: "@ingot/theme-aurora", exportName: "auroraTheme" },
    },
  };
  const appPreview = previewScaffold(appReq, rootDir);
  const created = await createScaffold(appReq, appPreview.fingerprint, rootDir);
  const appDir = path.join(rootDir, created.targetDir);
  const pluginsTs = fs.readFileSync(path.join(appDir, "src/plugins.ts"), "utf8");
  const mainTs = fs.readFileSync(path.join(appDir, "src/main.ts"), "utf8");
  const viteConfig = fs.readFileSync(path.join(appDir, "vite.config.ts"), "utf8");
  const pkg = JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), "utf8"));
  const themeSrc = fs.readFileSync(path.join(rootDir, "themes/aurora/src/theme.ts"), "utf8");
  assert.match(pluginsTs, /salesPlugin/);
  assert.doesNotMatch(pluginsTs, /platformPlugin/);
  assert.match(mainTs, /auroraTheme/);
  assert.match(mainTs, /@ingot\/theme-aurora\/style\.css/);
  assert.doesNotMatch(mainTs, /defaultAdminTheme/);
  assert.match(viteConfig, /"@ingot\/sales-plugin"/);
  assert.doesNotMatch(viteConfig, /platform-plugin/);
  assert.equal(pkg.dependencies["@ingot/sales-plugin"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/theme-aurora"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/platform-plugin"], undefined);
  assert.match(themeSrc, /"--in-color-primary": "#135"/);
  assert.match(themeSrc, /"--in-color-primary": "#9cf"/);
  fs.rmSync(rootDir, { recursive: true, force: true });
});
