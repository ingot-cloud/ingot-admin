import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import { MenuType } from "@/models/enums";
import type { MenuTreeNode } from "@/models";
import {
  PLUGIN_UNAVAILABLE_PAGE_KEY,
  PageLayoutViewPath,
  configurePageResolver,
  isPageRegistered,
} from "@/router/constants";
import { transformMenu } from "./route";

const dashboard = defineComponent({ name: "DashboardPage", template: "<div />" });
const unavailable = defineComponent({ name: "UnavailablePage", template: "<div />" });

const dashboardLoader = async () => dashboard;
const unavailableLoader = async () => unavailable;

describe("transformMenu", () => {
  it("按 canonical viewPath 解析页面", () => {
    configurePageResolver("ingot-admin", (pageKey) => {
      if (pageKey === "platform.dashboard") {
        return dashboardLoader;
      }
      if (pageKey === PLUGIN_UNAVAILABLE_PAGE_KEY) {
        return unavailableLoader;
      }
      return undefined;
    });

    const menu: MenuTreeNode = {
      name: "仪表盘",
      path: "/dashboard",
      routeName: "Dashboard",
      menuType: MenuType.Menu,
      viewPath: "platform.dashboard",
    };

    const routes = transformMenu([menu]);
    const route = routes.find((item) => item.path === "/dashboard");

    expect(isPageRegistered("platform.dashboard")).toBe(true);
    expect(route?.component).toBe(dashboardLoader);
  });

  it("未知页面绑定受控错误页并传入诊断信息", () => {
    configurePageResolver("ingot-admin", (pageKey) => {
      if (pageKey === PLUGIN_UNAVAILABLE_PAGE_KEY) {
        return unavailableLoader;
      }
      return undefined;
    });

    const unknownMenu: MenuTreeNode = {
      name: "未知页面",
      path: "/missing",
      routeName: "MissingPage",
      menuType: MenuType.Menu,
      viewPath: "target.unknown.page",
    };
    const routes = transformMenu([unknownMenu]);
    const unknownRoute = routes.find((route) => route.path === "/missing");

    expect(isPageRegistered("target.unknown.page")).toBe(false);
    expect(unknownRoute?.component).toBe(unavailableLoader);
    expect(unknownRoute?.props).toEqual({
      appCode: "ingot-admin",
      viewPath: "target.unknown.page",
    });
  });

  it("目录节点无 viewPath 时使用简单布局", () => {
    const simpleLayout = defineComponent({ name: "SimpleLayout", template: "<router-view />" });
    const simpleLoader = async () => simpleLayout;
    configurePageResolver("target-project", (pageKey) => {
      if (pageKey === PageLayoutViewPath.SIMPLE || pageKey === PLUGIN_UNAVAILABLE_PAGE_KEY) {
        return simpleLoader;
      }
      return undefined;
    });

    const directory: MenuTreeNode = {
      name: "Target Demo",
      path: "/target-demo",
      routeName: "TargetDemoRoot",
      menuType: MenuType.Directory,
    };
    const routes = transformMenu([directory]);
    const directoryRoute = routes.find((route) => route.path === "/target-demo");

    expect(directoryRoute?.component).toBe(simpleLoader);
    expect(directoryRoute?.props).toBeUndefined();
  });
});
