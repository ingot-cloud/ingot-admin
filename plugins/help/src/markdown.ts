import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import type { HelpArticle, HelpArticleAsset } from "./models/help";
import { HELP_ID } from "./models/help";

export type HelpMarkdownBlock =
  { kind: "html"; html: string } | { kind: "image"; image: HelpArticleAsset };
const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "s",
  "blockquote",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "a",
  "br",
  "hr",
];

/** 禁用原始HTML；图片与帮助链接只能指向服务端确认的引用闭包。 */
export function renderHelpMarkdown(
  article: HelpArticle,
  articleIds: Set<string>,
): HelpMarkdownBlock[] {
  const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });
  let headingIndex = 0;
  parser.renderer.rules.heading_open = (tokens, index) => {
    const heading = article.toc[headingIndex++];
    if (
      !heading ||
      heading.title !== tokens[index + 1]?.content ||
      !HELP_ID.test(heading.id) ||
      tokens[index].tag !== `h${heading.level}`
    )
      throw new Error("文章章节信息不一致");
    return `<${tokens[index].tag} id="${heading.id}">`;
  };
  parser.renderer.rules.image = (tokens, index) => {
    const source = tokens[index].attrGet("src") ?? "";
    const id = source.startsWith("help-asset:") ? source.slice("help-asset:".length) : "";
    if (!HELP_ID.test(id) || !article.assets.some((image) => image.id === id))
      throw new Error("文章引用了未授权的图片");
    return `INGOTHELPFIGURE${id}ENDHELPFIGURE`;
  };
  parser.renderer.rules.link_open = (tokens, index) => {
    const token = tokens[index];
    const source = token.attrGet("href") ?? "";
    if (source.startsWith("help:")) {
      const [id, heading] = source.slice("help:".length).split("#");
      if (!HELP_ID.test(id) || !articleIds.has(id) || (heading && !HELP_ID.test(heading)))
        throw new Error("文章链接不可用");
      token.attrSet("href", `/help/articles/${id}${heading ? `#${heading}` : ""}`);
    } else if (source.startsWith("#")) {
      if (!article.toc.some((heading) => `#${heading.id}` === source))
        throw new Error("文章章节不存在");
    } else {
      let url: URL;
      try {
        url = new URL(source);
      } catch {
        throw new Error("文章链接格式不合法");
      }
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        /\/help(?:\/|$)/.test(url.pathname)
      )
        throw new Error("文章外部链接不可用");
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener noreferrer");
    }
    return parser.renderer.renderToken(tokens, index, {});
  };
  const body = article.markdown
    .replace(/^(#{2,4}\s+.*?)\s+\{#[a-z0-9-]+\}\s*$/gm, "$1")
    .replace(
      /^:::(说明|注意|风险)\s*([^\n]*)\n([\s\S]*?)\n:::\s*$/gm,
      (_match, kind: string, title: string, content: string) =>
        [`> **${kind}** ${title}`, ">", ...content.split("\n").map((line) => `> ${line}`)].join(
          "\n",
        ),
    );
  let html = parser.render(body);
  if (headingIndex !== article.toc.length) throw new Error("文章章节目录不完整");
  html = html.replace(
    /<blockquote>\n<p><strong>(说明|注意|风险)<\/strong>/g,
    (_match, kind: string) =>
      `<blockquote class="help-callout ${kind === "风险" ? "is-risk" : kind === "注意" ? "is-warning" : "is-info"}">\n<p><strong>${kind}</strong>`,
  );
  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["id", "class", "href", "target", "rel", "start", "colspan", "rowspan"],
    ALLOW_DATA_ATTR: false,
  });
  const blocks: HelpMarkdownBlock[] = [];
  const pattern = /(?:<p>\s*)?INGOTHELPFIGURE([a-z0-9-]+)ENDHELPFIGURE(?:\s*<\/p>)?/g;
  let position = 0;
  for (const match of html.matchAll(pattern)) {
    if (match.index > position)
      blocks.push({ kind: "html", html: html.slice(position, match.index) });
    const image = article.assets.find((asset) => asset.id === match[1]);
    if (!image) throw new Error("文章配图不存在");
    blocks.push({ kind: "image", image });
    position = match.index + match[0].length;
  }
  if (position < html.length) blocks.push({ kind: "html", html: html.slice(position) });
  return blocks;
}
