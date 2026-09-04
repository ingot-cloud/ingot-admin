import { describe, expect, it, vi } from "vitest";
import { PlatformAuthorityTreeQueryOptions, platformPermissionQueryKeys } from "./authority.query";

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

vi.mock("./authority", () => ({
  GetAuthorityTreeAPI: vi.fn(() => Promise.resolve({ data: [] })),
}));

describe("platformPermissionQueryKeys", () => {
  it("树 Key 按筛选快照分层", () => {
    expect(platformPermissionQueryKeys.all).toEqual(["platform", "permission"]);
    expect(platformPermissionQueryKeys.trees()).toEqual(["platform", "permission", "tree"]);
    expect(platformPermissionQueryKeys.tree({ orgType: "Tenant" })).toEqual([
      "platform",
      "permission",
      "tree",
      { orgType: "Tenant" },
    ]);
  });
});

describe("PlatformAuthorityTreeQueryOptions", () => {
  it("Query Key 使用参数快照且 queryFn 透传 AbortSignal", async () => {
    const { GetAuthorityTreeAPI } = await import("./authority");
    const options = PlatformAuthorityTreeQueryOptions({ orgType: "Tenant", name: "" });
    expect(options.queryKey).toEqual(["platform", "permission", "tree", { orgType: "Tenant" }]);
    const signal = new AbortController().signal;
    await (options.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>)({ signal });
    expect(GetAuthorityTreeAPI).toHaveBeenCalledWith(
      { orgType: "Tenant", name: "" },
      { signal, feedback: "silent", progress: "silent" },
    );
  });
});
