import { describe, expect, it, vi } from "vitest";
import { renderHelpMarkdown } from "../../../../../plugins/help/src/markdown";
vi.mock("@ingot/help-plugin", async () => ({
  createStaticHelpProvider: (await import("../../../../../plugins/help/src/content/static"))
    .createStaticHelpProvider,
  commonHelpContent: (await import("../../../../../plugins/help/src/content/common"))
    .commonHelpContent,
}));
const provider = (await import("../content")).default;

describe("租户端实际静态说明", () => {
  it("22篇仅包含common和tenant，页面绑定和所有图文引用可读", async () => {
    const catalog = await provider.catalog(),
      summaries = catalog.categories.flatMap((category) => category.articles);
    expect(catalog.domain).toBe("TENANT");
    expect(summaries).toHaveLength(22);
    expect(catalog.pageBindings).toHaveLength(12);
    expect(summaries.every((article) => /^(common|tenant)-/.test(article.id))).toBe(true);
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
        expect(await provider.image(asset.id)).toContain("tenant-");
        expect(await provider.image(asset.thumbnailAssetId)).toContain("tenant-");
      }
    }
    await expect(provider.article("platform-accounts")).rejects.toThrow("当前端没有");
  });
  it("本地搜索正常且平台专属词不会影响总数", async () => {
    const results = await provider.search("导入", undefined, 1, 50);
    expect(results.items.map((item) => item.article.id)).toEqual(
      expect.arrayContaining(["tenant-member-workbook", "tenant-department-workbook"]),
    );
    expect((await provider.search("OAuth客户端", undefined, 1, 20)).total).toBe(0);
  });
});
