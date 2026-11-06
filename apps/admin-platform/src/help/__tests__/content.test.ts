import { describe, expect, it, vi } from "vitest";
import { renderHelpMarkdown } from "../../../../../plugins/help/src/markdown";
vi.mock("@ingot/help-plugin", async () => ({
  createStaticHelpProvider: (await import("../../../../../plugins/help/src/content/static"))
    .createStaticHelpProvider,
  commonHelpContent: (await import("../../../../../plugins/help/src/content/common"))
    .commonHelpContent,
}));
const provider = (await import("../content")).default;

describe("平台端实际静态说明", () => {
  it("24篇仅包含common和platform，页面绑定和所有图文引用可读", async () => {
    const catalog = await provider.catalog(),
      summaries = catalog.categories.flatMap((category) => category.articles);
    expect(catalog.domain).toBe("PLATFORM");
    expect(summaries).toHaveLength(24);
    expect(catalog.pageBindings).toHaveLength(17);
    expect(summaries.every((article) => /^(common|platform)-/.test(article.id))).toBe(true);
    const ids = new Set(summaries.map((article) => article.id));
    for (const summary of summaries) {
      const article = await provider.article(summary.id);
      expect(article.markdown).toContain("{#");
      expect(article.relatedArticles.every((related) => ids.has(related.id))).toBe(true);
      const blocks = renderHelpMarkdown(article, ids);
      expect(blocks.filter((block) => block.kind === "image")).toHaveLength(article.assets.length);
      expect(article.toc.map((heading) => heading.id)).toEqual([
        "purpose",
        "before-start",
        "entry",
        "fields",
        "steps",
        "result",
        "faq",
      ]);
      for (const asset of article.assets) {
        expect(asset.caption).toContain("非页面截图");
        expect(await provider.image(asset.id)).toContain("platform-");
        expect(await provider.image(asset.thumbnailAssetId)).toContain("platform-");
      }
    }
    await expect(provider.article("tenant-members")).rejects.toThrow("当前端没有");
  });
  it("本地搜索包含平台专属词且不包含租户导入材料", async () => {
    expect((await provider.search("OAuth客户端", undefined, 1, 20)).total).toBe(1);
    expect((await provider.search("初始密码下载", undefined, 1, 20)).total).toBe(0);
  });
});
