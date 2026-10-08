import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";

const state = vi.hoisted(() => ({ exist: false, mustChange: false }));
const bootstrap = vi.fn(async () => { state.exist = true; state.mustChange = true; });
const start = vi.fn();
const stop = vi.fn();
vi.mock("@/stores/modules/auth", () => ({
  ensureSessionBootstrap: () => bootstrap(),
  useUserInfoStore: () => ({
    get getUserInfoWhetherExist() { return state.exist; },
    get getIsInitPwd() { return state.mustChange; },
  }),
  DomainMismatchError: class extends Error {},
}));
vi.mock("@/hooks/biz/useGlobalLoading", () => ({ useGlobalLoading: () => ({ start, stop }) }));
const { UserInfoGuard } = await import("./userGuard");

function route(path: string, permitAuth = false): RouteLocationNormalized {
  return { path, fullPath: path, meta: { permitAuth } } as RouteLocationNormalized;
}

describe("强制改密路由", () => {
  beforeEach(() => { state.exist = false; state.mustChange = false; vi.clearAllMocks(); });

  it("首次加载后即转改密页，不进入动态业务路由", async () => {
    const to = route("/platform/members");
    const guard = new UserInfoGuard().exec();
    expect(await guard(to, route("/"), vi.fn())).toEqual({ path: "/init", replace: true });
    expect(to.meta.dynamicRoutes).toBe(false);
    expect(bootstrap).toHaveBeenCalledOnce();
    const init = route("/init");
    expect(await guard(init, to, vi.fn())).toBe(true);
    expect(init.meta.dynamicRoutes).toBe(false);
    expect(bootstrap).toHaveBeenCalledOnce();
  });

  it("公开认证入口不触发业务加载，正常身份仍装配路由", async () => {
    const guard = new UserInfoGuard().exec();
    expect(await guard(route("/auth/start", true), route("/"), vi.fn())).toBe(true);
    expect(bootstrap).not.toHaveBeenCalled();
    bootstrap.mockImplementationOnce(async () => { state.exist = true; state.mustChange = false; });
    const normal = route("/platform/members");
    expect(await guard(normal, route("/"), vi.fn())).toBe(true);
    expect(normal.meta.dynamicRoutes).toBe(true);
  });
});
