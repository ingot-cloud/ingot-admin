import { loadCatalog, publicCatalog } from "./catalog.mjs";
import { fail, ScaffoldError } from "./errors.mjs";
import { fingerprintOf } from "./fingerprint.mjs";
import { normalizeRequest } from "./normalize.mjs";
import { resolveTargetDir } from "./paths.mjs";
import { renderScaffold, toPreviewFiles } from "./render.mjs";
import { getPublicSchema } from "./schema.mjs";
import { validateRequest } from "./validate.mjs";
import { withTargetLock, writeExclusive } from "./write.mjs";

const assertPluginConflicts = (rootDir, options) => {
  const catalog = loadCatalog(rootDir);
  const targetDirectory = `plugins/${options.directoryId}`;
  if (catalog.plugins.some((plugin) => plugin.directory === targetDirectory)) {
    fail("TARGET_EXISTS", "插件目录已存在", { status: 409 });
  }
  if (catalog.plugins.some((plugin) => plugin.id === options.pluginId)) {
    fail("VALIDATION_ERROR", "插件 ID 已存在", {
      fields: { "options.pluginId": "不能与现有插件或核心重复" },
    });
  }
};

const assertThemeConflicts = (rootDir, options) => {
  const catalog = loadCatalog(rootDir);
  if (catalog.themes.some((theme) => theme.id === options.id || theme.directory.endsWith(`/${options.id}`))) {
    fail("VALIDATION_ERROR", "主题 ID 已存在", {
      fields: { "options.id": "不能与既有主题冲突" },
    });
  }
};

export const previewScaffold = (raw, rootDir) => {
  const request = normalizeRequest(raw);
  validateRequest(request, raw);
  if (request.kind === "plugin") {
    assertPluginConflicts(rootDir, request.options);
  }
  if (request.kind === "theme") {
    assertThemeConflicts(rootDir, request.options);
  }
  const rendered = renderScaffold(rootDir, request);
  const { relativeDir } = resolveTargetDir(rootDir, request.kind, rendered.directoryName);
  const fingerprint = fingerprintOf({
    request,
    files: rendered.files,
    catalogMeta: rendered.catalogMeta,
  });
  return {
    kind: request.kind,
    targetDir: relativeDir,
    packageName: rendered.packageName,
    fingerprint,
    files: toPreviewFiles(rendered.files),
    diagnostics: rendered.diagnostics ?? [],
    nextSteps: rendered.nextSteps,
    request,
    rendered,
  };
};

export const createScaffold = async (raw, fingerprint, rootDir) => {
  const preview = previewScaffold(raw, rootDir);
  if (preview.fingerprint !== fingerprint) {
    fail("PREVIEW_STALE", "预览已过期，请重新预览后再生成", { status: 409 });
  }
  const { targetDir, relativeDir } = resolveTargetDir(rootDir, preview.kind, preview.rendered.directoryName);
  await withTargetLock(targetDir, async () => {
    writeExclusive(targetDir, preview.rendered.files);
  });
  return {
    kind: preview.kind,
    targetDir: relativeDir,
    packageName: preview.packageName,
    files: preview.rendered.files.map((file) => file.path),
    nextSteps: preview.nextSteps,
  };
};

export const describePortal = () => ({
  schema: getPublicSchema(),
  configVersion: getPublicSchema().version,
});

export const listCatalog = (rootDir) => publicCatalog(rootDir);

export { ScaffoldError, normalizeRequest, getPublicSchema };
