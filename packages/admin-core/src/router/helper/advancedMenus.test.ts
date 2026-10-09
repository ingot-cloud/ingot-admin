import { beforeEach, describe, it, expect } from "vitest";
import { configurePageResolver } from "../constants";
import { defineComponent, h } from "vue";
import { transformMenu, generateMenus } from "./route";
import { mapIamMenus } from "./iamMenus";
import { mergeMenuTrees } from "./menus";
import { createRouter, createMemoryHistory } from "vue-router";
import { activeMenuPath } from "@/layouts/widgets/activeMenu";
import { buildBreadcrumbList } from "@/layouts/widgets/breadcrumb/buildBreadcrumbList";
beforeEach(() =>
  configurePageResolver(
    "test",
    () => async () => defineComponent({ render: () => h("div") }),
    () => [],
  ),
);
const nodes = mapIamMenus([
  {
    id: "1",
    applicationId: "app",
    name: "订单",
    kind: "DIRECTORY",
    path: "/orders",
    sortOrder: 0,
    children: [
      {
        id: "2",
        applicationId: "app",
        name: "列表",
        kind: "PAGE",
        path: "/orders/list",
        sortOrder: 0,
        children: [],
      },
      {
        id: "3",
        applicationId: "app",
        name: "详情",
        kind: "PAGE",
        path: "/orders/:a/:b",
        viewPath: "orders.detail",
        hidden: true,
        isCache: true,
        props: true,
        sortOrder: 1,
        children: [],
      },
    ],
  },
  {
    id: "4",
    applicationId: "empty",
    name: "无导航",
    kind: "DIRECTORY",
    path: "/empty",
    sortOrder: 0,
    children: [
      {
        id: "5",
        applicationId: "empty",
        name: "隐藏",
        kind: "PAGE",
        path: "/empty/hidden",
        hidden: true,
        sortOrder: 0,
        children: [],
      },
    ],
  },
]);
describe("advanced menu navigation", () => {
  it("隐藏页面保留授权路由，导航过滤隐藏页、参数页和空目录", () => {
    const routes = transformMenu(nodes);
    const nav = generateMenus(routes);
    expect(nav.map((n) => n.path)).toEqual(["/orders"]);
    expect(nav[0]?.children?.map((n) => n.path)).toEqual(["/orders/list"]);
    expect(routes[0]?.children?.find((r) => r.name === "iam-menu-3")?.props).toBe(true);
    expect(routes.find((r) => r.path === "/")?.redirect).toBe("/orders/list");
    expect(transformMenu([nodes[1]!]).find((r) => r.path === "/")?.redirect).toBe("/403");
    expect(
      generateMenus(transformMenu([{ name: "旧带参页", menuType: "1", path: "/old/:id" }])),
    ).toEqual([]);
  });
  it("隐藏详情高亮可导航祖先，面包屑生成实际参数地址", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: transformMenu(nodes) });
    await router.push("/orders/1001/normal");
    const route = router.currentRoute.value;
    expect(activeMenuPath(route, generateMenus(transformMenu(nodes)))).toBe("/orders");
    expect(buildBreadcrumbList(route.matched, route.params).at(-1)?.path).toBe(
      "/orders/1001/normal",
    );
    expect(
      activeMenuPath(route, [{ path: "/orders/list", applicationId: "app" }], "/orders/list"),
    ).toBe("/orders/list");
  });
  it("自动路由名参与冲突检查", () => {
    expect(() => mergeMenuTrees([{ id: "3", menuType: "1", path: "/static" }], nodes)).toThrow(
      "routeName",
    );
  });
});
