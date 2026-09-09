export interface HighlightPart {
  text: string;
  match: boolean;
}

export const splitHighlight = (text: string, keyword: string): HighlightPart[] => {
  const query = keyword.trim();
  if (!query || !text) {
    return [{ text, match: false }];
  }
  const source = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;
  let index = source.indexOf(needle, cursor);
  while (index >= 0) {
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), match: false });
    }
    const end = index + query.length;
    parts.push({ text: text.slice(index, end), match: true });
    cursor = end;
    index = source.indexOf(needle, cursor);
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), match: false });
  }
  return parts.length > 0 ? parts : [{ text, match: false }];
};
