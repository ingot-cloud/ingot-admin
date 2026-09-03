import fs from "node:fs";
import path from "node:path";
import type { InResolvedOfficialPlugin } from "./official-plugins.js";

export const UNO_CONTENT_GLOB = "**/*.{vue,ts,tsx,jsx,html}";

const toPosixGlob = (...segments: string[]): string =>
  path.join(...segments).replace(/\\/g, "/");

/**
 * App / 源码插件构建时，UnoCSS 除 Vite pipeline 外再扫这些目录：
 * 宿主 src、已解析官方插件 src、workspace 内 admin-core 源码（core 以 dist 消费时仍能抽出 attributify）。
 */
export const createUnoContentFilesystem = (
  rootDir: string,
  officialPlugins: InResolvedOfficialPlugin[] = [],
): string[] => {
  const globs = new Set<string>();
  globs.add(toPosixGlob(rootDir, "src", UNO_CONTENT_GLOB));

  for (const plugin of officialPlugins) {
    globs.add(toPosixGlob(plugin.srcDir, UNO_CONTENT_GLOB));
  }

  const coreSrc = path.resolve(rootDir, "../../packages/admin-core/src");
  if (fs.existsSync(coreSrc)) {
    globs.add(toPosixGlob(coreSrc, UNO_CONTENT_GLOB));
  }

  return [...globs];
};
