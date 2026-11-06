/// <reference lib="es2022.intl" />
import MarkdownIt from "markdown-it";
import type { HelpArticle, HelpSearchHit, HelpTextSegment } from "../models/help";

const parser = new MarkdownIt({ html: false });
const SNIPPET_LENGTH = 160;
const SNIPPET_CONTEXT = 36;
const WEIGHT = { title: 12, keywords: 8, heading: 4, body: 1, exactTitle: 20, containsTitle: 10 };

export const normalizeHelpText = (text: string): string => text.normalize("NFKC").toLowerCase();

export function helpPlainText(markdown: string): string {
  return parser
    .parse(
      markdown
        .replace(/\s+\{#[a-z0-9-]+\}/g, "")
        .replace(/^:::(说明|注意|风险)\s*(.*)$/gm, "$1 $2")
        .replace(/^:::\s*$/gm, ""),
      {},
    )
    .flatMap((token) => {
      if (token.type === "fence" || token.type === "code_block") return [token.content];
      if (token.type !== "inline") return [];
      return [
        (token.children ?? [])
          .map((child) =>
            child.type === "text" || child.type === "code_inline" || child.type === "image"
              ? child.content
              : child.type === "softbreak" || child.type === "hardbreak"
                ? " "
                : "",
          )
          .join(""),
      ];
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 归一化命中映射回原始字素，保持全角、组合字符及连字的显示文本。 */
function normalizedOffsets(text: string) {
  const parts = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
  );
  const offsets: { start: number; end: number }[] = [];
  let normalized = "";
  for (const part of parts) {
    const value = normalizeHelpText(part.segment);
    normalized += value;
    for (let index = 0; index < value.length; index++)
      offsets.push({ start: part.index, end: part.index + part.segment.length });
  }
  return { normalized, offsets };
}

export function highlightHelpText(text: string, terms: string[]): HelpTextSegment[] {
  const { normalized, offsets } = normalizedOffsets(text);
  const intervals: { start: number; end: number }[] = [];
  for (const term of terms) {
    let position = normalized.indexOf(term);
    while (position >= 0) {
      const start = offsets[position],
        end = offsets[position + term.length - 1];
      if (start && end) intervals.push({ start: start.start, end: end.end });
      position = normalized.indexOf(term, position + term.length);
    }
  }
  intervals.sort((left, right) => left.start - right.start);
  const merged: typeof intervals = [];
  intervals.forEach((range) => {
    const previous = merged[merged.length - 1];
    if (previous && previous.end >= range.start) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  });
  const result: HelpTextSegment[] = [];
  let position = 0;
  merged.forEach((range) => {
    if (range.start > position)
      result.push({ text: text.slice(position, range.start), matched: false });
    result.push({ text: text.slice(range.start, range.end), matched: true });
    position = range.end;
  });
  if (position < text.length) result.push({ text: text.slice(position), matched: false });
  return result;
}

function excerpt(text: string, terms: string[]): string {
  const { normalized, offsets } = normalizedOffsets(text);
  const matches = terms.map((term) => normalized.indexOf(term)).filter((position) => position >= 0);
  const first = matches.length ? (offsets[Math.min(...matches)]?.start ?? 0) : 0;
  const characters = Array.from(text);
  const firstCharacter = Array.from(text.slice(0, first)).length;
  const start = Math.max(0, firstCharacter - SNIPPET_CONTEXT);
  return `${start ? "…" : ""}${characters.slice(start, start + SNIPPET_LENGTH).join("")}${start + SNIPPET_LENGTH < characters.length ? "…" : ""}`;
}

export interface HelpSearchDocument {
  article: HelpArticle;
  keywords: string;
  text: string;
}

export function searchHelpDocuments(
  documents: HelpSearchDocument[],
  query: string,
): HelpSearchHit[] {
  const normalizedQuery = normalizeHelpText(query).trim();
  const terms = [...new Set(normalizedQuery.split(/\s+/))];
  return documents
    .flatMap(({ article, keywords, text }) => {
      const title = normalizeHelpText(article.title),
        words = normalizeHelpText(keywords),
        body = normalizeHelpText(text);
      const headings = article.toc.map((heading) => ({
        ...heading,
        normalized: normalizeHelpText(heading.title),
      }));
      if (
        !terms.every(
          (term) =>
            title.includes(term) ||
            words.includes(term) ||
            body.includes(term) ||
            headings.some((heading) => heading.normalized.includes(term)),
        )
      )
        return [];
      let score = terms.reduce(
        (sum, term) =>
          sum +
          (title.includes(term) ? WEIGHT.title : 0) +
          (words.includes(term) ? WEIGHT.keywords : 0) +
          (headings.some((heading) => heading.normalized.includes(term)) ? WEIGHT.heading : 0) +
          (body.includes(term) ? WEIGHT.body : 0),
        0,
      );
      if (title === normalizedQuery) score += WEIGHT.exactTitle;
      if (title.includes(normalizedQuery)) score += WEIGHT.containsTitle;
      const headingId = !terms.some((term) => title.includes(term) || words.includes(term))
        ? headings.find((heading) => terms.some((term) => heading.normalized.includes(term)))?.id
        : undefined;
      const summary = {
        id: article.id,
        title: article.title,
        summary: article.summary,
        categoryId: article.categoryId,
        updatedAt: article.updatedAt,
        readMinutes: article.readMinutes,
      };
      return [
        {
          score,
          article,
          hit: {
            article: summary,
            titleSegments: highlightHelpText(article.title, terms),
            snippetSegments: highlightHelpText(excerpt(text, terms), terms),
            headingId,
          },
        },
      ];
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.article.updatedAt.localeCompare(left.article.updatedAt) ||
        (left.article.id < right.article.id ? -1 : left.article.id > right.article.id ? 1 : 0),
    )
    .map((item) => item.hit);
}
