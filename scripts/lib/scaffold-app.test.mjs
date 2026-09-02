import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_OFFICIAL_PLUGIN_IDS, OFFICIAL_PLUGINS, scaffoldApp } from "./scaffold-app.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const makeRoot = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-scaffold-"));
  fs.mkdirSync(path.join(rootDir, "apps"));
  fs.cpSync(path.join(repoRoot, "scripts/templates/admin-app"), path.join(rootDir, "scripts/templates/admin-app"), {
    recursive: true,
  });
  return rootDir;
};

test("官方插件清单为四个源码插件，默认全选", () => {
  assert.deepEqual(
    OFFICIAL_PLUGINS.map((plugin) => plugin.id),
    ["ingot-platform", "ingot-security", "ingot-org", "ingot-member"],
  );
  assert.deepEqual(DEFAULT_OFFICIAL_PLUGIN_IDS, [
    "ingot-platform",
    "ingot-security",
    "ingot-org",
    "ingot-member",
  ]);
  assert.ok(OFFICIAL_PLUGINS.every((plugin) => plugin.available));
  assert.ok(OFFICIAL_PLUGINS.every((plugin) => plugin.packageName.endsWith("-plugin")));
});

test("脚手架默认全选官方插件，并生成集中式 plugins.ts", () => {
  const rootDir = makeRoot();
  const result = scaffoldApp({
    appCode: "acme-admin",
    rootDir,
  });

  assert.equal(result.appCode, "acme-admin");
  assert.deepEqual(result.officialPluginIds, DEFAULT_OFFICIAL_PLUGIN_IDS);

  const pluginsTs = fs.readFileSync(path.join(result.appDir, "src/plugins.ts"), "utf8");
  assert.match(pluginsTs, /import \{ platformPlugin \} from "@ingot\/platform-plugin";/);
  assert.match(pluginsTs, /import \{ securityPlugin \} from "@ingot\/security-plugin";/);
  assert.match(pluginsTs, /import \{ orgPlugin \} from "@ingot\/org-plugin";/);
  assert.match(pluginsTs, /import \{ memberPlugin \} from "@ingot\/member-plugin";/);
  assert.match(pluginsTs, /import \{ targetPlugin \} from "\.\/plugins\/targetPlugin";/);
  assert.match(
    pluginsTs,
    /export const appPlugins: InAdminPlugin\[] = \[platformPlugin, securityPlugin, orgPlugin, memberPlugin, targetPlugin];/,
  );

  const mainTs = fs.readFileSync(path.join(result.appDir, "src/main.ts"), "utf8");
  assert.match(mainTs, /import \{ appPlugins \} from "\.\/plugins";/);
  assert.match(mainTs, /appCode: env.VITE_APP_CODE \|\| "acme-admin"/);
  assert.match(mainTs, /plugins: appPlugins/);
  assert.doesNotMatch(mainTs, /adminPlugin/);

  const pkg = JSON.parse(fs.readFileSync(path.join(result.appDir, "package.json"), "utf8"));
  assert.equal(pkg.dependencies["@ingot/platform-plugin"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/security-plugin"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/org-plugin"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/member-plugin"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/admin-app"], undefined);

  const pluginTs = fs.readFileSync(path.join(result.appDir, "src/plugins/targetPlugin.ts"), "utf8");
  assert.match(pluginTs, /dependsOn: \["ingot-admin-core"\]/);

  const tsconfig = JSON.parse(fs.readFileSync(path.join(result.appDir, "tsconfig.app.json"), "utf8"));
  assert.deepEqual(tsconfig.compilerOptions.paths["@ingot/org-plugin"], ["./org-plugin.d.ts"]);
  assert.ok(fs.existsSync(path.join(result.appDir, "org-plugin.d.ts")));
  assert.ok(fs.existsSync(path.join(result.appDir, "README.md")));

  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("脚手架支持裁剪官方插件", () => {
  const rootDir = makeRoot();
  const result = scaffoldApp({
    appCode: "org-console",
    officialPluginIds: ["ingot-org"],
    withLocalPlugin: false,
    rootDir,
  });

  const pluginsTs = fs.readFileSync(path.join(result.appDir, "src/plugins.ts"), "utf8");
  assert.match(pluginsTs, /import \{ orgPlugin \} from "@ingot\/org-plugin";/);
  assert.doesNotMatch(pluginsTs, /platformPlugin/);
  assert.doesNotMatch(pluginsTs, /targetPlugin/);
  assert.match(pluginsTs, /export const appPlugins: InAdminPlugin\[] = \[orgPlugin];/);

  const pkg = JSON.parse(fs.readFileSync(path.join(result.appDir, "package.json"), "utf8"));
  assert.equal(pkg.dependencies["@ingot/org-plugin"], "workspace:*");
  assert.equal(pkg.dependencies["@ingot/platform-plugin"], undefined);
  assert.equal(pkg.dependencies["@ingot/security-plugin"], undefined);
  assert.equal(pkg.dependencies["@ingot/member-plugin"], undefined);
  assert.equal(fs.existsSync(path.join(result.appDir, "src/plugins")), false);

  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("脚手架允许空官方插件并保留本地插件骨架", () => {
  const rootDir = makeRoot();
  const result = scaffoldApp({
    appCode: "blank-admin",
    officialPluginIds: [],
    withLocalPlugin: true,
    rootDir,
  });

  const pluginsTs = fs.readFileSync(path.join(result.appDir, "src/plugins.ts"), "utf8");
  assert.doesNotMatch(pluginsTs, /@ingot\/(platform|security|org|member)-plugin/);
  assert.match(pluginsTs, /export const appPlugins: InAdminPlugin\[] = \[targetPlugin];/);

  const pkg = JSON.parse(fs.readFileSync(path.join(result.appDir, "package.json"), "utf8"));
  assert.equal(pkg.dependencies["@ingot/org-plugin"], undefined);
  assert.equal(pkg.dependencies["@ingot/platform-plugin"], undefined);
  assert.ok(fs.existsSync(path.join(result.appDir, "src/plugins/targetPlugin.ts")));

  fs.rmSync(rootDir, { recursive: true, force: true });
});
