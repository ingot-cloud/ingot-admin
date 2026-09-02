import type { Component } from "vue";
import type { AsyncComponentLoader, PageKey } from "./types";

export type PluginPageGlobModule = { default: Component };

export type PluginPageGlobModules = Record<string, () => Promise<PluginPageGlobModule>>;

export interface DefinePluginPagesOptions {
  /** 必须由调用方使用字面量 import.meta.glob（扫描 pages 下全部 Vue 文件）生成 */
  modules: PluginPageGlobModules;
  /** glob 路径前缀，如 `./pages` */
  sourceRoot: string;
  /** canonical 前缀，如 `ingot.security` */
  canonicalPrefix: string;
  /**
   * 旧 semantic 路径前缀（不含 `ingot.admin` / `ingot.base`），如 `platform.security`。
   * 将同时注册 `ingot.admin.{prefix}.{suffix}` 与 `ingot.base.{prefix}.{suffix}`。
   * 传空字符串时仅拼接相对 semantic 路径。
   */
  legacySemanticPrefix?: string;
  /**
   * 旧文件 key 前缀，如 `@/pages/platform/security`。
   * 所有 Vue 页面都会注册 `{legacyFilePrefix}/{relativePath}`。
   */
  legacyFilePrefix?: string;
}

const INDEX_PAGE_FILE = "IndexPage.vue";

const normalizeSlashes = (value: string): string => value.replace(/\\/g, "/");

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, "");

const joinSemanticKey = (...parts: string[]): string =>
  parts.filter((part) => part.length > 0).join(".");

const joinFileKey = (prefix: string, relativePath: string): string =>
  `${trimTrailingSlash(prefix)}/${trimLeadingSlash(relativePath)}`;

const toRelativePath = (globPath: string, sourceRoot: string): string => {
  const normalizedPath = normalizeSlashes(globPath);
  const normalizedRoot = trimTrailingSlash(normalizeSlashes(sourceRoot));
  if (normalizedPath.startsWith(`${normalizedRoot}/`)) {
    return normalizedPath.slice(normalizedRoot.length + 1);
  }
  const pathWithoutDot = normalizedPath.replace(/^\.\//, "");
  const rootWithoutDot = normalizedRoot.replace(/^\.\//, "");
  if (pathWithoutDot.startsWith(`${rootWithoutDot}/`)) {
    return pathWithoutDot.slice(rootWithoutDot.length + 1);
  }
  return pathWithoutDot;
};

const isIndexPage = (relativePath: string): boolean =>
  relativePath === INDEX_PAGE_FILE || relativePath.endsWith(`/${INDEX_PAGE_FILE}`);

const toSemanticSuffix = (relativePath: string): string => {
  const withoutIndex = relativePath.replace(/\/?IndexPage\.vue$/, "");
  const semanticPath = withoutIndex.replace(/\//g, ".").replace(/-/g, ".");
  return semanticPath || "home";
};

const toPageLoader = (loader: () => Promise<PluginPageGlobModule>): AsyncComponentLoader => {
  return async () => (await loader()).default;
};

/**
 * 为官方业务插件生成 canonical 页面键，并在迁移期同时注册旧 semantic / 文件路径键。
 * 同一页面的 canonical 与 legacy key 指向同一个异步 loader。
 */
export const definePluginPages = (
  options: DefinePluginPagesOptions,
): Record<PageKey, AsyncComponentLoader> => {
  const pages: Record<PageKey, AsyncComponentLoader> = {};
  const hasLegacySemantic = options.legacySemanticPrefix !== undefined;

  for (const [globPath, loader] of Object.entries(options.modules)) {
    const relativePath = toRelativePath(globPath, options.sourceRoot);
    const pageLoader = toPageLoader(loader);

    if (options.legacyFilePrefix) {
      pages[joinFileKey(options.legacyFilePrefix, relativePath)] = pageLoader;
    }

    if (!isIndexPage(relativePath)) {
      continue;
    }

    const suffix = toSemanticSuffix(relativePath);
    pages[joinSemanticKey(options.canonicalPrefix, suffix)] = pageLoader;

    if (hasLegacySemantic) {
      const legacySuffix = joinSemanticKey(options.legacySemanticPrefix ?? "", suffix);
      pages[joinSemanticKey("ingot.admin", legacySuffix)] = pageLoader;
      pages[joinSemanticKey("ingot.base", legacySuffix)] = pageLoader;
    }
  }

  return pages;
};
