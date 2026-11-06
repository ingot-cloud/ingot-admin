import { describe, expect, it } from "vitest";
import { createStaticHelpProvider } from "./static";
import { highlightHelpText, helpPlainText } from "./search";
import type { HelpContentDefinition } from "./types";

const fixture = (): HelpContentDefinition => ({
  domain: "TENANT",
  productVersion: "test-static",
  assets: { "tenant-flow": "/flow.png", "tenant-flow-thumb": "/flow-thumb.png" },
  categories: [
    {
      id: "tenant-root",
      title: "组织",
      description: "",
      icon: "ep:user",
      articleIds: ["tenant-member"],
      children: [
        {
          id: "tenant-child",
          title: "部门",
          description: "",
          icon: "ep:user",
          articleIds: ["tenant-department"],
        },
      ],
    },
  ],
  quickStartArticleIds: ["tenant-member"],
  faqArticleIds: [],
  pageBindings: [{ viewPath: "org.members", articleId: "tenant-member" }],
  articles: [
    {
      id: "tenant-member",
      title: "成员导入",
      summary: "说明",
      categoryId: "tenant-root",
      updatedAt: "2026-11-03T00:00:00Z",
      audienceDescription: "管理员",
      keywords: ["人员"],
      markdown:
        "## 操作步骤 {#steps}\n\n导入 ＡＢＣ、oﬃce 和 Café。\n\n![流程](help-asset:tenant-flow)\n",
      relatedArticleIds: ["tenant-department"],
      relatedViewPaths: [],
      assets: [
        {
          id: "tenant-flow",
          thumbnailAssetId: "tenant-flow-thumb",
          alt: "流程",
          caption: "概念关系",
          width: 800,
          height: 400,
        },
      ],
    },
    {
      id: "tenant-department",
      title: "部门",
      summary: "说明",
      categoryId: "tenant-child",
      updatedAt: "2026-11-02T00:00:00Z",
      audienceDescription: "管理员",
      keywords: ["组织"],
      markdown: "## 操作步骤 {#steps}\n\n也可以导入部门。\n",
      relatedArticleIds: [],
      relatedViewPaths: [],
      assets: [],
    },
  ],
});
describe("本地帮助提供器", () => {
  it("只提供定义中的文章和配图，拒绝跨端装配及跨域引用", async () => {
    const provider = createStaticHelpProvider(fixture());
    await expect(provider.article("platform-accounts")).rejects.toThrow("当前端没有");
    await expect(provider.image("platform-flow")).rejects.toThrow("当前端没有");
    expect(await provider.image("tenant-flow")).toBe("/flow.png");
    const wrongDomain = fixture();
    wrongDomain.domain = "PLATFORM";
    expect(() => createStaticHelpProvider(wrongDomain)).toThrow("域错误");
    const wrongLink = fixture();
    wrongLink.articles[0].markdown += "\n[越界](help:platform-accounts)\n";
    expect(() => createStaticHelpProvider(wrongLink)).toThrow("当前域");
  });
  it("分类子树先过滤，按权重稳定排序并返回真实分页总数", async () => {
    const provider = createStaticHelpProvider(fixture());
    const first = await provider.search("导入", "tenant-root", 1, 1);
    expect(first.total).toBe(2);
    expect(first.items[0].article.id).toBe("tenant-member");
    expect((await provider.search("导入", "tenant-root", 2, 1)).items[0].article.id).toBe(
      "tenant-department",
    );
    const beyond = await provider.search("导入", "tenant-root", 3, 1);
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(2);
    expect((await provider.search("导入", "tenant-child", 1, 20)).total).toBe(1);
    expect((await provider.search("人员 abc", undefined, 1, 20)).total).toBe(1);
    expect((await provider.search("操作步骤", undefined, 1, 20)).items[0].headingId).toBe("steps");
  });
  it("NFKC检索命中原始字形，纯文本高亮不生成HTML", async () => {
    const provider = createStaticHelpProvider(fixture());
    expect((await provider.search("office", undefined, 1, 20)).total).toBe(1);
    const text = "ＡＢＣ oﬃce Café <script>";
    const pieces = highlightHelpText(text, ["abc", "ffi", "café", "<script>"]);
    expect(pieces.map((part) => part.text).join("")).toBe(text);
    expect(pieces.filter((part) => part.matched).map((part) => part.text)).toEqual([
      "ＡＢＣ",
      "ﬃ",
      "Café",
      "<script>",
    ]);
    expect(helpPlainText("## 标题 {#title}\n\n**正文** [说明](help:tenant-member)\n")).toBe(
      "标题 正文 说明",
    );
  });
  it("不接受空白查询、非法分页或另一端分类", async () => {
    const provider = createStaticHelpProvider(fixture());
    for (const [query, page, size] of [
      [" ", 1, 20],
      ["成员", 0, 20],
      ["成员", 1, 51],
      ["成员", 1.5, 20],
    ] as const)
      await expect(provider.search(query, undefined, page, size)).rejects.toThrow("不合法");
    await expect(provider.search("成员", "platform-security", 1, 20)).rejects.toThrow("当前端没有");
  });
  it("不完整图片引用和重复/缺失章节不能装配", () => {
    const image = fixture();
    delete image.assets["tenant-flow"];
    expect(() => createStaticHelpProvider(image)).toThrow("资产引用");
    const missing = fixture();
    missing.articles[0].markdown = "## 没有稳定章节\n正文";
    expect(() => createStaticHelpProvider(missing)).toThrow("稳定");
    const duplicate = fixture();
    duplicate.articles[0].markdown += "\n## 重复 {#steps}\n";
    expect(() => createStaticHelpProvider(duplicate)).toThrow("重复");
  });
});
