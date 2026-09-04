import { describe, expect, it, vi } from "vitest";
import { DictPageQueryOptions, dictQueryKeys } from "./dict.query";

vi.mock("@ingot/admin-core", () => ({
  createResourceQueryKeys: (domain: string, resource: string) => {
    const all = [domain, resource] as const;
    return {
      all,
      lists: () => [...all, "list"] as const,
      list: (params: unknown) => [...all, "list", params] as const,
      details: () => [...all, "detail"] as const,
      detail: (id: string) => [...all, "detail", id] as const,
    };
  },
  createPageQueryOptions: (keys: { list: (params: unknown) => unknown }, fetchPage: unknown) => {
    return (input: { current: number; size: number; condition: Record<string, unknown> }) => ({
      queryKey: keys.list({
        current: input.current,
        size: input.size,
        condition: input.condition,
      }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        (fetchPage as Function)(
          { current: input.current, size: input.size },
          { ...input.condition },
          { signal, feedback: "silent", progress: "silent" },
        ).then((response: { data: unknown }) => response.data),
    });
  },
  silentQueryRequest: (signal?: AbortSignal) => ({
    signal,
    feedback: "silent",
    progress: "silent",
  }),
  snapshotQueryParams: (input: unknown) => {
    const walk = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(walk);
      }
      if (!value || typeof value !== "object") {
        return value;
      }
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        if (item === undefined || item === null || item === "") {
          return;
        }
        result[key] = walk(item);
      });
      return result;
    };
    return walk(input);
  },
}));

vi.mock("./dict", () => ({
  GetDictPageAPI: vi.fn(() =>
    Promise.resolve({ data: { current: 1, size: 20, total: 0, records: [] } }),
  ),
  GetDictTreeAPI: vi.fn(),
}));

describe("dictQueryKeys", () => {
  it("列表与树分层", () => {
    expect(dictQueryKeys.all).toEqual(["platform", "dict"]);
    expect(dictQueryKeys.lists()).toEqual(["platform", "dict", "list"]);
    expect(dictQueryKeys.trees()).toEqual(["platform", "dict", "tree"]);
    expect(dictQueryKeys.tree({ code: "status" })).toEqual([
      "platform",
      "dict",
      "tree",
      { code: "status" },
    ]);
  });
});

describe("DictPageQueryOptions", () => {
  it("Query Key 使用参数快照且 queryFn 透传 AbortSignal", async () => {
    const { GetDictPageAPI } = await import("./dict");
    const options = DictPageQueryOptions({
      current: 1,
      size: 20,
      condition: { code: "status", keyword: "" },
    });
    expect(options.queryKey).toEqual([
      "platform",
      "dict",
      "list",
      { current: 1, size: 20, condition: { code: "status", keyword: "" } },
    ]);
    const signal = new AbortController().signal;
    await (options.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>)({ signal });
    expect(GetDictPageAPI).toHaveBeenCalledWith(
      { current: 1, size: 20 },
      { code: "status", keyword: "" },
      { signal, feedback: "silent", progress: "silent" },
    );
  });
});
