import { describe, expect, it } from "vitest";
import { MenuType } from "@/models/enums";
import { defineStaticMenus, mergeMenuTrees } from "./menus";

describe("mergeMenuTrees", () => {
  it("静态在前、动态在后，同级拼接", () => {
    const staticMenus = defineStaticMenus([
      {
        name: "静态",
        path: "/demo",
        routeName: "StaticDemo",
        menuType: MenuType.Menu,
        viewPath: "acme.demo.overview",
      },
    ]);
    const dynamicMenus = [
      {
        name: "动态",
        path: "/dashboard",
        routeName: "Dashboard",
        menuType: MenuType.Menu,
        viewPath: "platform.dashboard",
      },
    ];
    const merged = mergeMenuTrees(staticMenus, dynamicMenus);
    expect(merged.map((item) => item.path)).toEqual(["/demo", "/dashboard"]);
  });

  it("path 冲突时抛错", () => {
    expect(() =>
      mergeMenuTrees(
        [{ name: "A", path: "/same", routeName: "A", menuType: MenuType.Menu }],
        [{ name: "B", path: "/same", routeName: "B", menuType: MenuType.Menu }],
      ),
    ).toThrow(/path “\/same” 冲突/);
  });

  it("routeName 冲突时抛错", () => {
    expect(() =>
      mergeMenuTrees(
        [{ name: "A", path: "/a", routeName: "Dup", menuType: MenuType.Menu }],
        [{ name: "B", path: "/b", routeName: "Dup", menuType: MenuType.Menu }],
      ),
    ).toThrow(/routeName “Dup” 冲突/);
  });
});
