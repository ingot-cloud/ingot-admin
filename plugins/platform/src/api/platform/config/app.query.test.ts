import { describe, expect, it, vi } from "vitest";
import { AppPageQueryOptions, appQueryKeys } from "./app.query";

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

vi.mock("./app", () => ({
  AppPageAPI: vi.fn(() => Promise.resolve({ data: { current: 1, size: 20, total: 0, records: [] } })),
  AppDetailAPI: vi.fn(),
  AppMenuTreeAPI: vi.fn(),
  AppPermissionTreeAPI: vi.fn(),
}));

describe("appQueryKeys", () => {
  it("列表、详情与嵌套资源分层", () => {
    expect(appQueryKeys.all).toEqual(["platform", "app"]);
    expect(appQueryKeys.lists()).toEqual(["platform", "app", "list"]);
    expect(appQueryKeys.detail("app-1")).toEqual(["platform", "app", "detail", "app-1"]);
    expect(appQueryKeys.menus("app-1")).toEqual(["platform", "app", "detail", "app-1", "menus"]);
    expect(appQueryKeys.permissions("app-1")).toEqual([
      "platform",
      "app",
      "detail",
      "app-1",
      "permissions",
    ]);
  });
});

describe("AppPageQueryOptions", () => {
  it("Query Key 使用参数快照且 queryFn 透传 AbortSignal", async () => {
    const { AppPageAPI } = await import("./app");
    const options = AppPageQueryOptions({
      current: 2,
      size: 10,
      condition: { name: "demo", status: "" },
    });
    expect(options.queryKey).toEqual([
      "platform",
      "app",
      "list",
      { current: 2, size: 10, condition: { name: "demo" } },
    ]);
    const signal = new AbortController().signal;
    await (options.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>)({ signal });
    expect(AppPageAPI).toHaveBeenCalledWith(
      { current: 2, size: 10 },
      { name: "demo", status: "" },
      { signal, feedback: "silent", progress: "silent" },
    );
  });
});
