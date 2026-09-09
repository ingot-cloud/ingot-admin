import { describe, expect, it, vi } from "vitest";
import { recordIconifyUsed } from "./recordIconifyUsed";

describe("recordIconifyUsed", () => {
  it("测试环境不请求收集接口", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await recordIconifyUsed("mynaui:config");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
