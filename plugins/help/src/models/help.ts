import type { AuthorizationDomain } from "@ingot/admin-core";

export type HelpEntry = "tenant" | "platform";
export interface HelpArticleSummary {
  id: string;
  title: string;
  summary: string;
  categoryId: string;
  updatedAt: string;
  readMinutes: number;
}
export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  children: HelpCategory[];
  articles: HelpArticleSummary[];
}
export interface HelpCatalog {
  schemaVersion: number;
  domain: AuthorizationDomain;
  contentVersion: string;
  productVersion: string;
  categories: HelpCategory[];
  quickStartArticleIds: string[];
  faqArticleIds: string[];
  recentArticleIds: string[];
  pageBindings: { viewPath: string; articleId: string }[];
}
export interface HelpHeading {
  id: string;
  title: string;
  level: number;
}
export interface HelpArticleAsset {
  id: string;
  thumbnailAssetId: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}
export interface HelpArticle extends HelpArticleSummary {
  domain: AuthorizationDomain;
  contentVersion: string;
  audienceDescription: string;
  markdown: string;
  toc: HelpHeading[];
  assets: HelpArticleAsset[];
  relatedArticles: HelpArticleSummary[];
  previousArticle?: HelpArticleSummary;
  nextArticle?: HelpArticleSummary;
  relatedViewPaths: string[];
}
export interface HelpTextSegment {
  text: string;
  matched: boolean;
}
export interface HelpSearchHit {
  article: HelpArticleSummary;
  titleSegments: HelpTextSegment[];
  snippetSegments: HelpTextSegment[];
  headingId?: string;
}
export interface HelpSearchPage {
  domain: AuthorizationDomain;
  contentVersion: string;
  items: HelpSearchHit[];
  total: number;
  page: number;
  pageSize: number;
}
export const HELP_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HELP_SCHEMA_VERSION = 1;
export const HELP_PAGE_SIZE = 20;
export const HELP_DOMAIN = { tenant: "TENANT", platform: "PLATFORM" } as const;

export function helpArticles(categories: HelpCategory[]): HelpArticleSummary[] {
  return categories.flatMap((item) => [...item.articles, ...helpArticles(item.children)]);
}
export function findHelpCategory(categories: HelpCategory[], id: string): HelpCategory | undefined {
  for (const item of categories) {
    if (item.id === id) return item;
    const child = findHelpCategory(item.children, id);
    if (child) return child;
  }
  return undefined;
}
export function helpCategoryTrail(categories: HelpCategory[], id: string): HelpCategory[] {
  for (const item of categories) {
    if (item.id === id) return [item];
    const children = helpCategoryTrail(item.children, id);
    if (children.length) return [item, ...children];
  }
  return [];
}
