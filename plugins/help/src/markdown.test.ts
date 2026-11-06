import { describe, expect, it } from "vitest";
import { renderHelpMarkdown } from "./markdown";
import type { HelpArticle } from "./models/help";

const article = (markdown: string): HelpArticle => ({
  domain: "TENANT",
  contentVersion: "a".repeat(64),
  id: "tenant-test",
  title: "成员说明",
  summary: "演示说明",
  categoryId: "tenant-organization",
  audienceDescription: "授权成员",
  updatedAt: "2026-11-03T00:00:00Z",
  readMinutes: 1,
  markdown,
  toc: [{ id: "steps", title: "操作步骤", level: 2 }],
  assets: [],
  relatedArticles: [],
  relatedViewPaths: [],
});
describe("帮助正文的安全渲染与引用闭包", () => {
  it("保留章节、列表和提示块，原始HTML只作为文字", () => {
    const blocks = renderHelpMarkdown(
      article(
        "## 操作步骤 {#steps}\n\n1. 添加成员\n\n:::注意\n确认当前组织。\n:::\n\n<script>alert(1)</script>",
      ),
      new Set(),
    );
    const html = blocks
      .filter((item) => item.kind === "html")
      .map((item) => item.html)
      .join("");
    expect(html).toContain('id="steps"');
    expect(html).toContain("<ol>");
    expect(html).toContain("help-callout is-warning");
    expect(html).not.toContain("<script>");
  });
  it("只将当前文章允许的图片变成组件，不生成外部img", () => {
    const data = article("## 操作步骤 {#steps}\n\n![关系图](help-asset:tenant-graph)");
    data.assets = [
      {
        id: "tenant-graph",
        thumbnailAssetId: "tenant-graph-thumb",
        width: 1200,
        height: 400,
        alt: "关系图",
        caption: "角色关系",
      },
    ];
    expect(
      renderHelpMarkdown(data, new Set()).filter((item) => item.kind === "image"),
    ).toHaveLength(1);
    expect(() =>
      renderHelpMarkdown(
        article("## 操作步骤 {#steps}\n\n![其他域](help-asset:platform-secret)"),
        new Set(),
      ),
    ).toThrow("未授权");
    expect(() =>
      renderHelpMarkdown(
        article("## 操作步骤 {#steps}\n\n![远程](https://example.com/image.png)"),
        new Set(),
      ),
    ).toThrow();
  });
  it("帮助链接只能指向已知本域文章，外部链接固定HTTPS与安全属性", () => {
    const value = article(
      "## 操作步骤 {#steps}\n\n[相关说明](help:tenant-members#steps)\n\n[参考](https://example.com/guide)",
    );
    const result = renderHelpMarkdown(value, new Set(["tenant-members"]));
    expect(JSON.stringify(result)).toContain("/help/articles/tenant-members#steps");
    expect(JSON.stringify(result)).toContain("noopener noreferrer");
    expect(() => renderHelpMarkdown(value, new Set())).toThrow("链接不可用");
    expect(() =>
      renderHelpMarkdown(
        article("## 操作步骤 {#steps}\n\n[跨端](https://other.example/help/articles/secret)"),
        new Set(),
      ),
    ).toThrow();
  });
  it("章节元数据不一致时拒绝渲染，避免伪造定位", () => {
    expect(() => renderHelpMarkdown(article("## 另一个标题 {#steps}"), new Set())).toThrow(
      "章节信息不一致",
    );
  });
});
