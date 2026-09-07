import { describe, expect, it } from "vitest";
import { BLOCK_EVENT_TABLE_ID, blockEventTableHeaders } from "./blockEventTable";

describe("security access block event table contract", () => {
  it("提供稳定 tableId，无行操作", () => {
    expect(BLOCK_EVENT_TABLE_ID).toBe("security-access-block-event");
    expect(blockEventTableHeaders.some((item) => item.prop === "actions")).toBe(false);
  });
});
