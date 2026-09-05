import { describe, expect, it } from "vitest";
import { CommonStatus } from "@/models/enums";
import { resolveCommonStatus } from "./resolveCommonStatus";

describe("resolveCommonStatus", () => {
  it("识别字符串和数字状态码", () => {
    expect(resolveCommonStatus("0")).toBe(CommonStatus.Enable);
    expect(resolveCommonStatus(0)).toBe(CommonStatus.Enable);
    expect(resolveCommonStatus("9")).toBe(CommonStatus.Lock);
  });

  it("没有 status 时回退 enabled/locked", () => {
    expect(resolveCommonStatus(undefined, { enabled: true, locked: false })).toBe(
      CommonStatus.Enable,
    );
    expect(resolveCommonStatus(undefined, { enabled: true, locked: true })).toBe(CommonStatus.Lock);
    expect(resolveCommonStatus(undefined, { enabled: false })).toBe(CommonStatus.Lock);
  });

  it("无法识别时返回 undefined", () => {
    expect(resolveCommonStatus()).toBeUndefined();
    expect(resolveCommonStatus("unknown")).toBeUndefined();
  });
});
