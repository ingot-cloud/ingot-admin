import {
  HELP_ID,
  HELP_SCHEMA_VERSION,
  helpArticles,
  type HelpArticle,
  type HelpArticleSummary,
  type HelpCatalog,
  type HelpCategory,
  type HelpHeading,
} from "../models/help";
import type { HelpContentDefinition, HelpContentProvider, HelpSourceCategory } from "./types";
import { helpPlainText, normalizeHelpText, searchHelpDocuments } from "./search";

const MAX_PAGE_SIZE = 50;
const MAX_QUERY_LENGTH = 100;
const CHARACTERS_PER_MINUTE = 400;
const unavailable = (): Error => new Error("当前端没有此说明或配图");
const assertContent = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};

function headings(markdown: string): HelpHeading[] {
  const result: HelpHeading[] = [];
  let fence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence || !/^#{1,6}\s/.test(line)) continue;
    const match = /^(#{2,4})\s+(.+?)\s+\{#([a-z0-9-]+)\}\s*$/.exec(line);
    assertContent(match, "帮助章节需要稳定的h2～h4锚点");
    if (match) result.push({ id: match[3], title: match[2], level: match[1].length });
  }
  assertContent(
    new Set(result.map((heading) => heading.id)).size === result.length,
    "帮助章节锚点重复",
  );
  return result;
}

const summaryOf = (article: HelpArticle): HelpArticleSummary => ({
  id: article.id,
  title: article.title,
  summary: article.summary,
  categoryId: article.categoryId,
  updatedAt: article.updatedAt,
  readMinutes: article.readMinutes,
});

/** 组合当前宿主的静态源码；不导入或探测其他宿主，也不调用HTTP。 */
export function createStaticHelpProvider(definition: HelpContentDefinition): HelpContentProvider {
  const prefix = definition.domain === "TENANT" ? "tenant-" : "platform-";
  const allowed = (id: string): boolean =>
    HELP_ID.test(id) && (id.startsWith("common-") || id.startsWith(prefix));
  const articles = new Map<string, HelpArticle>();
  const texts = new Map<string, string>();
  for (const source of definition.articles) {
    assertContent(allowed(source.id) && !articles.has(source.id), "帮助文章域错误或ID重复");
    assertContent(
      /Z$/.test(source.updatedAt) && Number.isFinite(Date.parse(source.updatedAt)),
      "帮助更新时间必须为UTC ISO",
    );
    const text = helpPlainText(source.markdown);
    texts.set(source.id, text);
    articles.set(source.id, {
      id: source.id,
      title: source.title,
      summary: source.summary,
      categoryId: source.categoryId,
      updatedAt: source.updatedAt,
      readMinutes: Math.max(
        1,
        Math.ceil(Array.from(text.replace(/\s/g, "")).length / CHARACTERS_PER_MINUTE),
      ),
      domain: definition.domain,
      contentVersion: definition.productVersion,
      audienceDescription: source.audienceDescription,
      markdown: source.markdown,
      toc: headings(source.markdown),
      assets: source.assets,
      relatedArticles: [],
      relatedViewPaths: source.relatedViewPaths,
    });
  }
  const categories = new Map<string, Set<string>>();
  const assigned = new Set<string>();
  const makeCategory = (source: HelpSourceCategory): HelpCategory => {
    assertContent(allowed(source.id) && !categories.has(source.id), "帮助分类域错误或ID重复");
    const selected = new Set<string>();
    categories.set(source.id, selected);
    const children = (source.children ?? []).map(makeCategory);
    children.forEach((child) => categories.get(child.id)?.forEach((id) => selected.add(id)));
    const items = source.articleIds.map((id, index) => {
      const article = articles.get(id);
      assertContent(
        article && article.categoryId === source.id && !assigned.has(id),
        "帮助分类引用错误",
      );
      if (!article) throw unavailable();
      assigned.add(id);
      selected.add(id);
      article.previousArticle = index
        ? summaryOf(articles.get(source.articleIds[index - 1])!)
        : undefined;
      article.nextArticle =
        index + 1 < source.articleIds.length
          ? summaryOf(articles.get(source.articleIds[index + 1])!)
          : undefined;
      return summaryOf(article);
    });
    return {
      id: source.id,
      title: source.title,
      description: source.description,
      icon: source.icon,
      children,
      articles: items,
    };
  };
  const tree = definition.categories.map(makeCategory);
  assertContent(assigned.size === articles.size, "帮助文章未归类");
  const assets = new Set<string>();
  for (const source of definition.articles) {
    const article = articles.get(source.id)!;
    article.relatedArticles = source.relatedArticleIds.map((id) => {
      const related = articles.get(id);
      if (!related) throw unavailable();
      return summaryOf(related);
    });
    for (const asset of article.assets) {
      assertContent(allowed(asset.id) && allowed(asset.thumbnailAssetId), "帮助配图域错误");
      assertContent(
        asset.width > 0 && asset.height > 0 && asset.alt && asset.caption,
        "帮助配图描述不完整",
      );
      assets.add(asset.id);
      assets.add(asset.thumbnailAssetId);
    }
    for (const match of article.markdown.matchAll(/!?\[[^\]]*\]\((help:|help-asset:)([^)]+)\)/g)) {
      const [id, anchor] = match[2].split("#");
      if (match[1] === "help-asset:")
        assertContent(
          article.assets.some((asset) => asset.id === id),
          "帮助正文图片不在当前文章",
        );
      else
        assertContent(
          articles.has(id) &&
            (!anchor || articles.get(id)?.toc.some((heading) => heading.id === anchor)),
          "帮助文章链接或章节不在当前域",
        );
    }
  }
  assertContent(
    Object.keys(definition.assets).length === assets.size &&
      Object.keys(definition.assets).every((id) => assets.has(id)),
    "帮助资产引用闭包错误",
  );
  assertContent(
    [...assets].every((id) => Boolean(definition.assets[id])),
    "帮助配图缺少URL",
  );
  assertContent(
    [
      ...definition.quickStartArticleIds,
      ...definition.faqArticleIds,
      ...definition.pageBindings.map((binding) => binding.articleId),
    ].every((id) => articles.has(id)),
    "帮助首页或页面说明引用错误",
  );
  assertContent(
    new Set(definition.pageBindings.map((binding) => binding.viewPath)).size ===
      definition.pageBindings.length,
    "页面主说明重复",
  );
  const catalog: HelpCatalog = {
    schemaVersion: HELP_SCHEMA_VERSION,
    domain: definition.domain,
    contentVersion: definition.productVersion,
    productVersion: definition.productVersion,
    categories: tree,
    quickStartArticleIds: definition.quickStartArticleIds,
    faqArticleIds: definition.faqArticleIds,
    recentArticleIds: helpArticles(tree)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id))
      .slice(0, 6)
      .map((article) => article.id),
    pageBindings: definition.pageBindings,
  };
  const documents = definition.articles.map((source) => ({
    article: articles.get(source.id)!,
    keywords: source.keywords.join(" "),
    text: texts.get(source.id)!,
  }));
  return {
    domain: definition.domain,
    catalog: async () => catalog,
    article: async (id) => {
      const article = articles.get(id);
      if (!article) throw unavailable();
      return article;
    },
    image: async (id) => {
      if (!assets.has(id)) throw unavailable();
      return definition.assets[id];
    },
    search: async (q, categoryId, page, pageSize) => {
      const query = normalizeHelpText(q).trim();
      if (
        !query ||
        Array.from(query).length > MAX_QUERY_LENGTH ||
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > MAX_PAGE_SIZE
      )
        throw new Error("搜索关键词或分页参数不合法");
      const selected = categoryId ? categories.get(categoryId) : undefined;
      if (categoryId && !selected) throw unavailable();
      const hits = searchHelpDocuments(
        selected ? documents.filter((document) => selected.has(document.article.id)) : documents,
        query,
      );
      return {
        domain: definition.domain,
        contentVersion: definition.productVersion,
        total: hits.length,
        page,
        pageSize,
        items: hits.slice((page - 1) * pageSize, page * pageSize),
      };
    },
  };
}
