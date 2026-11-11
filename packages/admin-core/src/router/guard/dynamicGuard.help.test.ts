import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { MenuConfigurationError, NAVIGATION_ERROR_PATH } from "@/router/navigationError";

const state = vi.hoisted(() => ({ hasMenus: false, conflict: false, install: vi.fn() }));
vi.mock("@/stores/modules/router", () => ({
  useRouterStore: () => ({
    fetchRoutes: async () => {
      if (state.conflict) throw new MenuConfigurationError("path", "/same", "重复地址");
      return { dynamicRoutes: state.hasMenus ? [{ path: "/business" }] : [] };
    },
    installDynamicRoutes: state.install,
  }),
}));
const { DynamicRouterGuard } = await import("./dynamicGuard");

describe("受保护帮助路由的动态菜单装配", () => {
  beforeEach(() => {
    state.hasMenus = false;
    state.conflict = false;
    vi.clearAllMocks();
  });
  it("没有菜单时只允许已注册帮助路由，不扩展普通业务或未知路由", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/help", component: {}, meta: { helpReader: true } },
        { path: "/unknown", component: {} },
      ],
    });
    const guard = new DynamicRouterGuard().exec(router);
    const help = router.resolve("/help"),
      unknown = router.resolve("/unknown");
    help.meta.dynamicRoutes = true;
    unknown.meta.dynamicRoutes = true;
    expect(await guard(help, unknown, vi.fn())).toBe(true);
    expect(await guard(unknown, help, vi.fn())).toBe(false);
    expect(help.meta.permitAuth).not.toBe(true);
  });
  it("首次安装业务菜单时保留帮助深链的查询和章节 hash", async () => {
    state.hasMenus = true;
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/help/articles/:articleId", component: {}, meta: { helpReader: true } }],
    });
    const target = router.resolve("/help/articles/tenant-roles?source=search#steps");
    target.meta.dynamicRoutes = true;
    const result = await new DynamicRouterGuard().exec(router)(target, target, vi.fn());
    expect(result).toEqual({
      path: target.path,
      replace: true,
      query: target.query,
      hash: "#steps",
    });
    expect(router.resolve(result as { path: string; hash: string }).fullPath).toBe(target.fullPath);
    expect(state.install).toHaveBeenCalledOnce();
  });

  it("路由装配再次遇到冲突时进入错误页，不安装部分路由", async () => {
    state.conflict = true;
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/orders", component: {} }],
    });
    const to = router.resolve("/orders?q=1#details");
    to.meta.dynamicRoutes = true;
    expect(await new DynamicRouterGuard().exec(router)(to, to, vi.fn())).toEqual({
      path: NAVIGATION_ERROR_PATH,
      replace: true,
      query: { returnTo: to.fullPath },
    });
    expect(state.install).not.toHaveBeenCalled();
  });
});
