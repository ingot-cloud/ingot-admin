import { describe, expect, it } from "vitest";
import { CommonStatus } from "@/models/enums";
import { resolveCommonStatus } from "./resolveCommonStatus";

describe("resolveCommonStatus", () => {
  it("识别字符串和数字状态码", () => {
    expect(resolveCommonStatus("0")).toBe(CommonStatus.Enable);
    expect(resolveCommonStatus(0)).toBe(CommonStatus.Enable);
    expect(resolveCommonStatus("9")).toBe(CommonStatus.Lock);
  });

  it("无法识别时返回 undefined", () => {
    expect(resolveCommonStatus()).toBeUndefined();
    expect(resolveCommonStatus("unknown")).toBeUndefined();
  });
});
