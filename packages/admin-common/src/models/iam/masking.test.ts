import { describe, expect, it } from "vitest";
import { MaskKind } from "./constants";
import { defaultIamMask, isValidIamMask, previewIamMask } from "./masking";

describe("脱敏配置示例与后端策略一致", () => {
  it.each([
    [MaskKind.ALL, "张小明", "***"],
    [MaskKind.ALL, "", "***"],
    [MaskKind.PHONE, "13812345678", "138****5678"],
    [MaskKind.PHONE, "1234567", "***"],
    [MaskKind.PHONE, "138-1234-5678", "***"],
    [MaskKind.PHONE, "１２３４５６７８", "１２３*５６７８"],
    [MaskKind.EMAIL, "alice@example.com", "a***@example.com"],
    [MaskKind.EMAIL, "a@example.com", "***@example.com"],
    [MaskKind.EMAIL, "😀a@example.com", "😀***@example.com"],
    [MaskKind.EMAIL, "alice@@example.com", "***"],
    [MaskKind.EMAIL, "a\u2003b@example.com", "***"],
    [MaskKind.EMAIL, "a\u0085b@example.com", "***"],
    [MaskKind.EMAIL, "a\u00a0b@example.com", "a***@example.com"],
    [MaskKind.EMAIL, "@example.com", "***"],
    [MaskKind.EMAIL, "alice@", "***"],
    [MaskKind.KEEP_EDGES, "abcdef", "a****f"],
    [MaskKind.KEEP_EDGES, "😀中国🚀", "😀**🚀"],
    [MaskKind.KEEP_EDGES, "😀🚀", "***"],
    [MaskKind.RANGE, "abcdef", "a**def"],
    [MaskKind.RANGE, "😀中国🚀", "😀**🚀"],
  ])("%s：%s → %s", (kind, input, expected) => {
    expect(previewIamMask(input, defaultIamMask(kind as MaskKind))).toBe(expected);
  });
  it("区间结束截断到原文末尾，起始超出原文时全遮盖", () => {
    expect(previewIamMask("abc", { kind: MaskKind.RANGE, start: 1, end: 20 })).toBe("a**");
    expect(previewIamMask("abc", { kind: MaskKind.RANGE, start: 3, end: 4 })).toBe("***");
    expect(previewIamMask("abc", { kind: MaskKind.KEEP_EDGES, prefix: 0, suffix: 0 })).toBe("***");
  });
  it("无效或残留参数不能当成有效配置", () => {
    for (const mask of [
      { kind: MaskKind.RANGE, start: 2, end: 2 },
      { kind: MaskKind.RANGE, start: -1, end: 2 },
      { kind: MaskKind.RANGE, start: 0, end: 257 },
      { kind: MaskKind.KEEP_EDGES, prefix: 1.5, suffix: 1 },
      { kind: MaskKind.KEEP_EDGES, prefix: 257, suffix: 1 },
      { kind: MaskKind.PHONE, prefix: 1 },
    ]) {
      expect(isValidIamMask(mask)).toBe(false);
      expect(previewIamMask("abcdef", mask)).toBe("***");
    }
  });
});
