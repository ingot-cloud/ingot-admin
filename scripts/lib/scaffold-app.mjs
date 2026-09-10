/**
 * 共享脚手架兼容层：CLI 与测试仍可同步写入 App。
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_OFFICIAL_PLUGIN_IDS, OFFICIAL_PLUGINS } from "./scaffold/constants.mjs";
import { previewScaffold } from "./scaffold/engine.mjs";
import { toKebab } from "./scaffold/identifiers.mjs";
import { resolveTargetDir } from "./scaffold/paths.mjs";
import { writeExclusive } from "./scaffold/write.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../..");
export { OFFICIAL_PLUGINS, DEFAULT_OFFICIAL_PLUGIN_IDS, toKebab };

export const TEMPLATE_DIR = path.join(REPO_ROOT, "scripts/templates/admin-app");

const toRequest = (input) => ({
  version: 1,
  kind: "app",
  options: {
    appCode: input.appCode,
    withDemo: input.withLocalPlugin !== false,
    officialPluginIds: input.officialPluginIds ?? DEFAULT_OFFICIAL_PLUGIN_IDS,
    dev: {
      port: Number(input.port ?? 5800),
      host: "localhost",
      enableDevTools: true,
    },
    env: input.title ? { common: { VITE_APP_TITLE: input.title } } : undefined,
  },
});

export const scaffoldApp = (input) => {
  const rootDir = input.rootDir ?? REPO_ROOT;
  const request = toRequest(input);
  const preview = previewScaffold(request, rootDir);
  const { targetDir } = resolveTargetDir(rootDir, "app", preview.rendered.directoryName);
  writeExclusive(targetDir, preview.rendered.files);
  const officialPluginIds = (input.officialPluginIds ?? DEFAULT_OFFICIAL_PLUGIN_IDS).filter(Boolean);
  return {
    appCode: preview.rendered.directoryName,
    appDir: targetDir,
    port: String(input.port ?? 5800),
    officialPluginIds,
    withLocalPlugin: input.withLocalPlugin !== false,
  };
};
