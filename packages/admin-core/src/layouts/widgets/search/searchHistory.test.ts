import { describe, expect, it } from "vitest";
import {
  HEADER_SEARCH_ANONYMOUS_USER_KEY,
  HEADER_SEARCH_HISTORY_LIMIT,
  clearSearchHistoryForUser,
  pushSearchHistoryKeyword,
  resolveSearchHistoryUserKey,
} from "./searchHistory";

describe("resolveSearchHistoryUserKey", () => {
  it("优先使用 phone，其次 email，否则匿名", () => {
    expect(resolveSearchHistoryUserKey({ phone: "13800138000", email: "a@b.c" })).toBe(
      "13800138000",
    );
    expect(resolveSearchHistoryUserKey({ email: "a@b.c" })).toBe("a@b.c");
    expect(resolveSearchHistoryUserKey({})).toBe(HEADER_SEARCH_ANONYMOUS_USER_KEY);
    expect(resolveSearchHistoryUserKey()).toBe(HEADER_SEARCH_ANONYMOUS_USER_KEY);
  });
});

describe("pushSearchHistoryKeyword", () => {
  it("忽略空白，命中后去重置顶并截断上限", () => {
    expect(pushSearchHistoryKeyword(["部门"], "  ")).toEqual(["部门"]);
    expect(pushSearchHistoryKeyword(["部门", "成员"], "成员")).toEqual(["成员", "部门"]);
    const overflow = Array.from({ length: HEADER_SEARCH_HISTORY_LIMIT }, (_, index) => `k${index}`);
    expect(pushSearchHistoryKeyword(overflow, "最新")).toEqual([
      "最新",
      ...overflow.slice(0, HEADER_SEARCH_HISTORY_LIMIT - 1),
    ]);
  });
});

describe("clearSearchHistoryForUser", () => {
  it("只删除当前用户分桶", () => {
    expect(
      clearSearchHistoryForUser({ a: ["1"], b: ["2"] }, "a"),
    ).toEqual({ b: ["2"] });
  });
});
