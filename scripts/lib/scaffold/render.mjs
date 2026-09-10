import { appNextSteps, renderAppFiles } from "./render-app.mjs";
import { pluginNextSteps, renderPluginFiles } from "./render-plugin.mjs";
import { renderThemeFiles, themeNextSteps } from "./render-theme.mjs";

export const renderScaffold = (rootDir, request) => {
  if (request.kind === "plugin") {
    const rendered = renderPluginFiles(request.options);
    return {
      files: rendered.files,
      packageName: rendered.packageName,
      directoryName: request.options.directoryId,
      nextSteps: pluginNextSteps(request.options),
      catalogMeta: {},
    };
  }
  if (request.kind === "theme") {
    const rendered = renderThemeFiles(request.options);
    return {
      files: rendered.files,
      packageName: rendered.packageName,
      directoryName: request.options.id,
      nextSteps: themeNextSteps(request.options),
      catalogMeta: {},
    };
  }
  const rendered = renderAppFiles(rootDir, request.options);
  return {
    files: rendered.files,
    packageName: request.options.appCode,
    directoryName: request.options.appCode,
    nextSteps: appNextSteps(request.options),
    catalogMeta: rendered.catalogMeta,
    diagnostics: rendered.theme.kind === "default" ? [] : [],
  };
};

export const toPreviewFiles = (files) =>
  files.map((file) => {
    if (file.kind === "binary") {
      return { path: file.path, kind: "binary", bytes: file.buffer.byteLength };
    }
    const bytes = Buffer.byteLength(file.content, "utf8");
    return { path: file.path, kind: "text", content: file.content, bytes };
  });
