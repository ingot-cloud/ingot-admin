import type { Component } from "vue";
import type { AsyncComponentLoader, PageKey } from "./types";

export type PluginPageGlobModule = { default: Component };

export type PluginPageGlobModules = Record<string, () => Promise<PluginPageGlobModule>>;

export interface DefinePluginPagesOptions {
  /** 必须由调用方使用字面量 import.meta.glob 生成 */
  modules: PluginPageGlobModules;
  /** glob 路径前缀，如 `./pages` 或 `../layouts` */
  sourceRoot: string;
  /** canonical 前缀，如 `security` 或 `layout` */
  canonicalPrefix: string;
}

const INDEX_PAGE_FILE = "IndexPage.vue";

const normalizeSlashes = (value: string): string => value.replace(/\\/g, "/");

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const joinSemanticKey = (...parts: string[]): string =>
  parts.filter((part) => part.length > 0).join(".");

const stripQuery = (value: string): string => value.replace(/[?#].*$/, "");

const toRelativePath = (globPath: string, sourceRoot: string): string => {
  const normalizedPath = stripQuery(normalizeSlashes(globPath));
  const normalizedRoot = trimTrailingSlash(normalizeSlashes(sourceRoot));
  if (normalizedPath.startsWith(`${normalizedRoot}/`)) {
    return normalizedPath.slice(normalizedRoot.length + 1);
  }
  const pathWithoutDot = normalizedPath.replace(/^\.\//, "");
  const rootWithoutDot = normalizedRoot.replace(/^\.\//, "");
  if (pathWithoutDot.startsWith(`${rootWithoutDot}/`)) {
    return pathWithoutDot.slice(rootWithoutDot.length + 1);
  }
  const marker = `/${rootWithoutDot}/`;
  const markerIndex = normalizedPath.lastIndexOf(marker);
  if (markerIndex >= 0) {
    return normalizedPath.slice(markerIndex + marker.length);
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

/** kebab-case appCode → 点分 prefix，如 `ingot-admin` → `ingot.admin` */
export const toViewPrefix = (appCode: string): string => appCode.replaceAll("-", ".");

/** 由视图键生成默认可编辑菜单 path */
export const toDefaultMenuPath = (viewKey: string): string => `/${viewKey.replaceAll(".", "/")}`;

/**
 * 为插件生成 canonical 页面/布局键。只注册 IndexPage.vue。
 */
export const definePluginPages = (
  options: DefinePluginPagesOptions,
): Record<PageKey, AsyncComponentLoader> => {
  const pages: Record<PageKey, AsyncComponentLoader> = {};

  for (const [globPath, loader] of Object.entries(options.modules)) {
    const relativePath = toRelativePath(globPath, options.sourceRoot);
    if (!isIndexPage(relativePath)) {
      continue;
    }
    const suffix = toSemanticSuffix(relativePath);
    pages[joinSemanticKey(options.canonicalPrefix, suffix)] = toPageLoader(loader);
  }

  return pages;
};
