import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import { MenuConfigurationError, NAVIGATION_ERROR_PATH } from "@/router/navigationError";

const state = vi.hoisted(() => ({ exist: false, mustChange: false, conflict: false }));
const bootstrap = vi.fn(async () => {
  state.exist = true;
  state.mustChange = true;
});
const start = vi.fn();
const stop = vi.fn();
vi.mock("@/stores/modules/auth", () => ({
  ensureSessionBootstrap: () => bootstrap(),
  useUserInfoStore: () => ({
    get getUserInfoWhetherExist() {
      return state.exist;
    },
    get getIsInitPwd() {
      return state.mustChange;
    },
  }),
  DomainMismatchError: class extends Error {},
}));
vi.mock("@/hooks/biz/useGlobalLoading", () => ({ useGlobalLoading: () => ({ start, stop }) }));
vi.mock("@/stores/modules/router", () => ({
  useRouterStore: () => ({
    get configurationError() {
      return state.conflict;
    },
  }),
}));
const { UserInfoGuard } = await import("./userGuard");

function route(path: string, permitAuth = false): RouteLocationNormalized {
  return { path, fullPath: path, meta: { permitAuth } } as RouteLocationNormalized;
}

describe("强制改密路由", () => {
  beforeEach(() => {
    state.exist = false;
    state.mustChange = false;
    state.conflict = false;
    vi.clearAllMocks();
  });

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
    bootstrap.mockImplementationOnce(async () => {
      state.exist = true;
      state.mustChange = false;
    });
    const normal = route("/platform/members");
    expect(await guard(normal, route("/"), vi.fn())).toBe(true);
    expect(normal.meta.dynamicRoutes).toBe(true);
  });

  it("菜单冲突进入独立错误页，不取消首屏到空白或循环加载", async () => {
    bootstrap.mockRejectedValueOnce(new MenuConfigurationError("path", "/same", "重复地址"));
    const guard = new UserInfoGuard().exec();
    const to = route("/orders");
    expect(await guard(to, route("/"), vi.fn())).toEqual({
      path: NAVIGATION_ERROR_PATH,
      replace: true,
      query: { returnTo: "/orders" },
    });
    expect(stop).toHaveBeenCalled();
    expect(await guard(route(NAVIGATION_ERROR_PATH, true), to, vi.fn())).toBe(true);
    expect(bootstrap).toHaveBeenCalledOnce();
  });

  it("刷新冲突后后退到旧业务页也不能恢复页面或绕过校验", async () => {
    state.exist = true;
    state.conflict = true;
    const to = route("/orders");
    expect(
      await new UserInfoGuard().exec()(to, route(NAVIGATION_ERROR_PATH, true), vi.fn()),
    ).toEqual({
      path: NAVIGATION_ERROR_PATH,
      replace: true,
      query: { returnTo: "/orders" },
    });
    expect(bootstrap).not.toHaveBeenCalled();
  });
});
