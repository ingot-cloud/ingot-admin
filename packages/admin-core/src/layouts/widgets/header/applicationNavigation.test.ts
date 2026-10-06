import { describe, expect, it } from "vitest";
import type { MenuRouteRecord } from "@/layouts";
import { applicationMenus, applicationForPath, navigableApplications, navigableApplicationPath } from "./applicationNavigation";

const menus: MenuRouteRecord[] = [
  { path: "/platform", title: "平台", applicationId: "1", children: [
    { path: "/platform/members", title: "人员", applicationId: "1" },
  ] },
  { path: "/developer", title: "开发者", applicationId: "2", children: [
    { path: "/developer/qrcode", title: "二维码", applicationId: "2" },
  ] },
];
describe("IAM 应用导航", () => {
  it("排序及过滤均复用授权应用和菜单，不产生空应用入口", () => {
    const apps = navigableApplications([
      { id: "1", code: "iam-platform", name: "平台", sortOrder: 2, icon: "ep:monitor" },
      { id: "2", code: "develop", name: "开发者", sortOrder: 1, icon: "https://example.test/icon.png" },
      { id: "3", code: "empty", name: "无菜单", sortOrder: 0 },
    ], menus);
    expect(apps.map(app => app.id)).toEqual(["2", "1"]);
    expect(apps[0].icon).toBe("https://example.test/icon.png");
    expect(navigableApplicationPath(applicationMenus(menus, "2"))).toBe("/developer/qrcode");
    expect(applicationMenus(menus, "2")).toHaveLength(1);
    expect(applicationMenus(menus, "unknown")).toEqual([]);
  });
  it("刷新和搜索跳转按最具体菜单路径同步应用，详情继承所属菜单", () => {
    expect(applicationForPath(menus, "/developer/qrcode")).toBe("2");
    expect(applicationForPath(menus, "/platform/members/123")).toBe("1");
    expect(applicationForPath(menus, "/platform-extra")).toBeUndefined();
    expect(applicationForPath(menus, "/unregistered")).toBeUndefined();
  });
});
