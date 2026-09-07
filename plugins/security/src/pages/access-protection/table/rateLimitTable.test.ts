import { describe, expect, it } from "vitest";
import {
  createRateLimitRowActions,
  createRateLimitToolbarActions,
  RATE_LIMIT_TABLE_ID,
  rateLimitTableHeaders,
} from "./rateLimitTable";

describe("security access rate limit table contract", () => {
  it("提供稳定 tableId", () => {
    expect(RATE_LIMIT_TABLE_ID).toBe("security-access-rate-limit");
    expect(rateLimitTableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏新建限流规则始终直出，行内编辑为详情", () => {
    const toolbar = createRateLimitToolbarActions(() => undefined);
    expect(toolbar).toEqual([
      expect.objectContaining({
        key: "create",
        label: "新建限流规则",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
      }),
    ]);
    const rows = createRateLimitRowActions({ id: 1, code: "rl-1" }, { onDetail: () => undefined });
    expect(rows.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:detail"]);
    expect(rows[0]?.label).toBe("编辑");
  });
});
