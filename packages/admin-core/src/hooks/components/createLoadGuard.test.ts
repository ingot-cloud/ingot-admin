import { describe, expect, it } from "vitest";
import { createLoadGuard } from "./createLoadGuard";

describe("createLoadGuard", () => {
  it("后一次加载会让前一次结果失效", () => {
    const guard = createLoadGuard();
    const first = guard.begin();
    const second = guard.begin();
    expect(first.isCurrent()).toBe(false);
    expect(second.isCurrent()).toBe(true);
  });
});
