import { describe, expect, it } from "vitest";
import { splitHighlight } from "./splitHighlight";

describe("splitHighlight", () => {
  it("空关键词整段不匹配", () => {
    expect(splitHighlight("成员权限", "  ")).toEqual([{ text: "成员权限", match: false }]);
  });

  it("按大小写不敏感切开匹配段，保留原文大小写", () => {
    expect(splitHighlight("成员权限", "成员")).toEqual([
      { text: "成员", match: true },
      { text: "权限", match: false },
    ]);
    expect(splitHighlight("Overview", "view")).toEqual([
      { text: "Over", match: false },
      { text: "view", match: true },
    ]);
  });
});
