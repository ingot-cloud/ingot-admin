import { beforeEach, it, expect, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { defineComponent, h } from "vue";
import { configurePageResolver } from "@/router/constants";
import { configureAdminRuntime } from "@/runtime";
import { useRouterStore } from "./router";
vi.mock("@/api/common/iam", () => ({ IamBootstrapAPI: vi.fn() }));
import { IamBootstrapAPI } from "@/api/common/iam";
const Page = defineComponent({ render: () => h("div") });
const menus = [
  {
    id: "1",
    name: "订单",
    path: "/orders",
    viewPath: "orders",
    routeName: "orders",
    menuType: "1",
    isCache: true,
  },
];
beforeEach(() => {
  vi.mocked(IamBootstrapAPI).mockReset();
  setActivePinia(createPinia());
  configureAdminRuntime({
    appCode: "test",
    branding: { title: "test" },
    login: { fingerprintEnabled: false },
    plugins: [],
  });
  configurePageResolver(
    "test",
    () => async () => Page,
    () => [],
  );
});
it("重复bootstrap保留缓存，变化时替换实际动态路由并清除旧名称", async () => {
  const store = useRouterStore();
  store.applyRemoteMenus(menus);
  const epoch = store.cacheEpoch;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/login", component: Page }],
  });
  await router.push("/login");
  store.installDynamicRoutes(router);
  expect(router.hasRoute("orders")).toBe(true);
  store.applyRemoteMenus(JSON.parse(JSON.stringify(menus)));
  expect(store.cacheEpoch).toBe(epoch);
  store.applyRemoteMenus([{ ...menus[0]!, path: "/new", routeName: "new" }]);
  expect(router.hasRoute("orders")).toBe(false);
  expect(router.hasRoute("new")).toBe(true);
  expect(router.resolve("/new").name).toBe("new");
  expect(store.cacheEpoch).toBe(epoch + 1);
  store.clearForPasswordChange();
  expect(router.hasRoute("new")).toBe(false);
  expect(store.menus).toEqual([]);
});

it("成功装配空菜单后不因menus为空再次拉取bootstrap", async () => {
  const store = useRouterStore();
  store.applyRemoteMenus([]);
  const routes = await store.fetchRoutes();
  expect(routes.menus).toEqual([]);
  expect(IamBootstrapAPI).not.toHaveBeenCalled();
});
it("身份已切换时丢弃旧菜单请求的迟到响应", async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(IamBootstrapAPI).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }) as ReturnType<typeof IamBootstrapAPI>,
  );
  const store = useRouterStore();
  const pending = store.fetchRoutes();
  store.clearForPasswordChange();
  const epoch = store.cacheEpoch;
  resolve({ data: { menus: [] } });
  await pending;
  expect(store.cacheEpoch).toBe(epoch);
  expect(store.menus).toEqual([]);
});

it("同一菜单指纹重复安装不移除再注册路由，身份清理后仍可重新装配", () => {
  const store = useRouterStore();
  store.applyRemoteMenus(menus);
  const router = createRouter({ history: createMemoryHistory(), routes: [] });
  const add = vi.spyOn(router, "addRoute");
  store.installDynamicRoutes(router);
  const count = add.mock.calls.length;
  store.installDynamicRoutes(router);
  expect(add).toHaveBeenCalledTimes(count);
  store.clearForPasswordChange();
  store.applyRemoteMenus(menus);
  store.installDynamicRoutes(router);
  expect(add.mock.calls.length).toBeGreaterThan(count);
});
