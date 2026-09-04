import { describe, expect, it, vi } from "vitest";
import { createResourceQueryKeys } from "./keys";
import { createPageQueryOptions } from "./page-options";

describe("createPageQueryOptions", () => {
  it("生成列表 Key 并透传 silent signal", async () => {
    const keys = createResourceQueryKeys("platform", "id");
    const fetchPage = vi.fn(() =>
      Promise.resolve({ data: { current: 1, size: 20, total: 0, records: [] } }),
    );
    const options = createPageQueryOptions(keys, fetchPage)({
      current: 1,
      size: 20,
      condition: { bizTag: "leaf", empty: "" },
    });
    expect(options.queryKey).toEqual([
      "platform",
      "id",
      "list",
      { current: 1, size: 20, condition: { bizTag: "leaf" } },
    ]);
    const signal = new AbortController().signal;
    await (options.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>)({ signal });
    expect(fetchPage).toHaveBeenCalledWith(
      { current: 1, size: 20 },
      { bizTag: "leaf", empty: "" },
      { signal, feedback: "silent", progress: "silent" },
    );
  });
});
