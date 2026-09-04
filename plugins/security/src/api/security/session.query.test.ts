import { describe, expect, it, vi } from "vitest";
import {
  hasSessionQueryConstraint,
  SessionPageQueryOptions,
  sessionQueryKeys,
} from "./session.query";

vi.mock("@ingot/admin-core", () => ({
  REALTIME_QUERY_STALE_TIME: 0,
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
  snapshotQueryParams: (input: unknown) => JSON.parse(JSON.stringify(input)),
}));

vi.mock("./session", () => ({
  SessionPageAPI: vi.fn(() =>
    Promise.resolve({ data: { current: 1, size: 20, total: 0, records: [] } }),
  ),
  GetSessionAPI: vi.fn(),
}));

describe("sessionQueryKeys", () => {
  it("包含租户、客户端、用户、IP 和分页参数", () => {
    const params = {
      current: 1,
      size: 20,
      condition: { tenantId: "t1", clientId: "c1", userId: "u1", ipAddress: "1.1.1.1" },
    };
    expect(sessionQueryKeys.list(params)).toEqual(["security", "session", "list", params]);
    expect(sessionQueryKeys.detail("sid-1")).toEqual(["security", "session", "detail", "sid-1"]);
  });
});

describe("hasSessionQueryConstraint", () => {
  it("必须指定客户端或用户", () => {
    expect(hasSessionQueryConstraint({})).toBe(false);
    expect(hasSessionQueryConstraint({ clientId: "c1" })).toBe(true);
    expect(hasSessionQueryConstraint({ userId: "u1" })).toBe(true);
  });
});

describe("SessionPageQueryOptions", () => {
  it("高实时数据 staleTime 为 0，并透传 AbortSignal", async () => {
    const { SessionPageAPI } = await import("./session");
    const options = SessionPageQueryOptions({
      current: 1,
      size: 20,
      condition: { clientId: "web" },
    });
    expect(options.staleTime).toBe(0);
    const signal = new AbortController().signal;
    await (options.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>)({ signal });
    expect(SessionPageAPI).toHaveBeenCalledWith(
      { current: 1, size: 20 },
      { clientId: "web" },
      { signal, feedback: "silent", progress: "silent" },
    );
  });
});
