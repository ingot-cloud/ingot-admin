import type {
  HelpArticle,
  HelpArticleAsset,
  HelpArticleSummary,
  HelpCatalog,
  HelpSearchPage,
} from "../models/help";

/** 阅读层只依赖内容来源，不约定未来维护后台的传输协议。 */
export interface HelpContentProvider {
  readonly domain: HelpCatalog["domain"];
  catalog(): Promise<HelpCatalog>;
  article(id: string): Promise<HelpArticle>;
  search(
    q: string,
    categoryId: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<HelpSearchPage>;
  image(id: string): Promise<string>;
}

export interface HelpSourceCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  articleIds: string[];
  children?: HelpSourceCategory[];
}

export interface HelpSourceArticle extends Omit<HelpArticleSummary, "readMinutes"> {
  audienceDescription: string;
  markdown: string;
  keywords: string[];
  assets: HelpArticleAsset[];
  relatedArticleIds: string[];
  relatedViewPaths: string[];
}

/** common只包含两端一致的说明；专属内容由各宿主自行导入。 */
export interface HelpContentSources {
  categories: HelpSourceCategory[];
  articles: HelpSourceArticle[];
  assets: Record<string, string>;
}

export interface HelpContentDefinition extends HelpContentSources {
  domain: HelpCatalog["domain"];
  productVersion: string;
  quickStartArticleIds: string[];
  faqArticleIds: string[];
  pageBindings: HelpCatalog["pageBindings"];
}
