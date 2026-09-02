import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoadDataParams, Page } from "@ingot/admin-core";

const get = vi.fn();
const filterParams = vi.fn((params: object) => params);

vi.mock("@ingot/admin-core", () => ({
  request: { get },
  filterParams,
}));

const { loadTenantOptions, TenantOptionPageAPI, toTenantOptionPageParams } = await import("./tenant");
const { loadClientOptions, ClientOptionPageAPI, toClientOptionPageParams } = await import("./client");

describe("只读 option 查询", () => {
  beforeEach(() => {
    get.mockReset();
    filterParams.mockClear();
  });

  it("租户查询会过滤空参数并请求 page 接口", async () => {
    const page: Page = { current: 1, size: 20 };
    const condition = { name: "acme" };
    const envelope = {
      data: { current: 1, size: 20, records: [{ id: "1", name: "acme" }] },
    };
    get.mockResolvedValue(envelope);

    const params = toTenantOptionPageParams(page, condition);
    expect(filterParams).toHaveBeenCalledWith(condition);
    expect(params).toEqual({ current: 1, size: 20, name: "acme" });

    await TenantOptionPageAPI(page, condition);
    expect(get).toHaveBeenCalledWith("/api/pms/v1/platform/org/tenant/page", params);
  });

  it("Client 查询会把搜索词映射为 clientName", async () => {
    const page: Page = { current: 2, size: 10 };
    const condition = { clientName: "web" };
    get.mockResolvedValue({ data: { records: [] } });

    const params = toClientOptionPageParams(page, condition);
    expect(params).toEqual({ current: 2, size: 10, clientName: "web" });

    await ClientOptionPageAPI(page, condition);
    expect(get).toHaveBeenCalledWith("/api/auth/client/page", params);
  });

  it("选择器加载函数把 query 转成对应筛选字段", async () => {
    const tenantPage: Page<{ id: string }> = { records: [{ id: "t1" }] };
    const clientPage: Page<{ id: string }> = { records: [{ id: "c1" }] };
    get
      .mockResolvedValueOnce({ data: tenantPage })
      .mockResolvedValueOnce({ data: clientPage });

    const loadParams: LoadDataParams = { current: 1, size: 20, query: "demo" };

    await expect(loadTenantOptions(loadParams)).resolves.toEqual(tenantPage);
    expect(get).toHaveBeenNthCalledWith(1, "/api/pms/v1/platform/org/tenant/page", {
      current: 1,
      size: 20,
      name: "demo",
    });

    await expect(loadClientOptions(loadParams)).resolves.toEqual(clientPage);
    expect(get).toHaveBeenNthCalledWith(2, "/api/auth/client/page", {
      current: 1,
      size: 20,
      clientName: "demo",
    });
  });
});
