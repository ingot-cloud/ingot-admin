import { beforeEach, it, expect } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { defineComponent, h } from "vue";
import { configurePageResolver } from "@/router/constants";
import { configureAdminRuntime } from "@/runtime";
import { useRouterStore } from "./router";
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
  setActivePinia(createPinia());
  configureAdminRuntime({ appCode: "test", branding: { title: "test" }, login: { fingerprintEnabled: false }, plugins: [] });
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
