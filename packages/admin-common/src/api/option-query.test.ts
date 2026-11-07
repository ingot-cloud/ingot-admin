import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoadDataParams, Page } from "@ingot/admin-core";

const get = vi.fn();
const filterParams = vi.fn((params: object) => params);
const queryAdminData = vi.fn(
  async (opts: { queryFn: (context: { signal: AbortSignal }) => Promise<unknown> }) =>
    opts.queryFn({ signal: new AbortController().signal }),
);

vi.mock("@ingot/admin-core", () => ({
  request: { get },
  filterParams,
  queryAdminData,
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
  snapshotQueryParams: (input: unknown) => JSON.parse(JSON.stringify(input)),
  silentQueryRequest: (signal?: AbortSignal) => ({
    signal,
    feedback: "silent",
    progress: "silent",
  }),
  REFERENCE_QUERY_STALE_TIME: 5 * 60_000,
}));

const { ClientOptionPageAPI, toClientOptionPageParams } = await import("./client");
const { loadClientOptions } = await import("./client.query");

describe("只读 option 查询", () => {
  beforeEach(() => {
    get.mockReset();
    filterParams.mockClear();
    queryAdminData.mockClear();
  });

  it("Client 查询会把搜索词映射为 clientName", async () => {
    const page: Page = { current: 2, size: 10 };
    const condition = { clientName: "web" };
    get.mockResolvedValue({ data: { records: [] } });

    const params = toClientOptionPageParams(page, condition);
    expect(params).toEqual({ current: 2, size: 10, clientName: "web" });

    await ClientOptionPageAPI(page, condition);
    expect(get).toHaveBeenCalledWith("/api/auth/client/page", params, undefined);
  });

  it("选择器加载函数把 query 转成对应筛选字段，并走引用数据缓存", async () => {
    const clientPage: Page<{ id: string }> = { records: [{ id: "c1" }] };
    get.mockResolvedValueOnce({ data: clientPage });

    const loadParams: LoadDataParams = { current: 1, size: 20, query: "demo" };

    await expect(loadClientOptions(loadParams)).resolves.toEqual(clientPage);
    expect(get).toHaveBeenNthCalledWith(
      1,
      "/api/auth/client/page",
      {
        current: 1,
        size: 20,
        clientName: "demo",
      },
      expect.objectContaining({ feedback: "silent", progress: "silent" }),
    );
  });
});
