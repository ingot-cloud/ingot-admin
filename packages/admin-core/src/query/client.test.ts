import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@ingot/http-client";
import {
  bindAdminQueryClient,
  clearAdminQueryCache,
  createAdminQueryClient,
  getAdminQueryClient,
  queryAdminData,
  resetAdminQueryClient,
} from "./client";
import { isRetriableQueryError } from "./types";

const warning = vi.fn();

vi.mock("@/utils/message", () => ({
  Message: { warning: (...args: unknown[]) => warning(...args) },
}));

describe("createAdminQueryClient", () => {
  afterEach(() => {
    resetAdminQueryClient();
    warning.mockReset();
  });

  it("默认策略符合 DESIGN", () => {
    const client = createAdminQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(10 * 60_000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it("retry predicate 只对可重试错误重试一次", () => {
    const client = createAdminQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe("function");
    const retryFn = retry as (failureCount: number, error: unknown) => boolean;
    expect(retryFn(0, new ApiError({ kind: "network", message: "offline", retriable: true }))).toBe(true);
    expect(retryFn(1, new ApiError({ kind: "network", message: "offline", retriable: true }))).toBe(false);
    expect(retryFn(0, new ApiError({ kind: "business", message: "no", code: "S0002" }))).toBe(false);
  });

  it("登出时取消并清空缓存", async () => {
    const client = bindAdminQueryClient(createAdminQueryClient());
    client.setQueryData(["platform", "app"], { id: "1" });
    expect(client.getQueryData(["platform", "app"])).toEqual({ id: "1" });
    clearAdminQueryCache();
    expect(client.getQueryData(["platform", "app"])).toBeUndefined();
    expect(getAdminQueryClient()).toBe(client);
  });

  it("queryAdminData 走 QueryClient.query", async () => {
    const client = bindAdminQueryClient(createAdminQueryClient({ staleTime: 0 }));
    const spy = vi.spyOn(client, "query").mockResolvedValue({ ok: true });
    await expect(
      queryAdminData({
        queryKey: ["platform", "app", "probe"],
        queryFn: async () => ({ ok: true }),
      }),
    ).resolves.toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("未接管的最终错误只提示一次", () => {
    const client = createAdminQueryClient();
    client.getQueryCache().config.onError?.(new ApiError({ kind: "business", message: "失败" }), {
      meta: {},
    } as never);
    client.getQueryCache().config.onError?.(new ApiError({ kind: "business", message: "失败" }), {
      meta: { skipGlobalError: true },
    } as never);
    expect(warning).toHaveBeenCalledTimes(1);
  });
});

describe("isRetriableQueryError", () => {
  it("识别网络、超时和 503", () => {
    expect(isRetriableQueryError(new ApiError({ kind: "timeout", message: "t", retriable: true }))).toBe(true);
    expect(isRetriableQueryError(new ApiError({ kind: "http", message: "t", status: 503, retriable: true }))).toBe(
      true,
    );
    expect(isRetriableQueryError(new ApiError({ kind: "cancelled", message: "c", cancelled: true }))).toBe(false);
  });
});
