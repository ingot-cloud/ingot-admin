import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ logout: vi.fn(), clear: vi.fn(), go: vi.fn() }));
vi.mock("@/stores/modules/auth", () => ({ useAuthStore: () => ({ logout: mocks.logout }) }));
vi.mock("@/query", () => ({ clearAdminQueryCache: mocks.clear }));
vi.mock("@/hooks/biz/useLogin", () => ({ useLogin: () => ({ go: mocks.go }) }));
beforeEach(() => {
  vi.resetModules();
  mocks.logout.mockReset();
  mocks.go.mockReset();
  mocks.go.mockResolvedValue(undefined);
});

describe("logout navigation", () => {
  it("并发401和再次点击只退出、跳转一次，调用方可等待结束", async () => {
    let finish!: () => void;
    mocks.logout.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { logoutAndReload } = await import("./security");
    const first = logoutAndReload(true);
    const second = logoutAndReload(true);
    expect(first).toBeInstanceOf(Promise);
    expect(first).toBe(second);
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    finish();
    await first;
    expect(mocks.go).toHaveBeenCalledOnce();
    await logoutAndReload(true);
    expect(mocks.go).toHaveBeenCalledOnce();
    expect(mocks.go).toHaveBeenCalledWith({ rememberReturnTo: true, forceLogin: true });
  });
});
