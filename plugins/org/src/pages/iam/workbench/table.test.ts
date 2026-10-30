import { describe, expect, it } from "vitest";
import type { MenuRouteRecord } from "@ingot/admin-core";
import { workbenchEntries } from "./table";

describe("工作台菜单入口", () => {
  it("保留授权菜单顺序、图标及应用，排除目录、自身与重复项", () => {
    const menus: MenuRouteRecord[] = [
      {
        path: "/group",
        title: "组织管理",
        applicationId: "org",
        children: [
          { path: "/members", title: "成员", icon: "ep:user" },
          { path: "/departments", title: "部门", icon: "ep:office-building" },
        ],
      },
      { path: "/workbench", title: "工作台", icon: "ep:menu" },
      { path: "/members", title: "重复成员", icon: "ep:warning" },
      { path: "/blank", title: " " },
    ];
    expect(workbenchEntries(menus, "/workbench")).toEqual([
      {
        path: "/members",
        title: "成员",
        icon: "ep:user",
        applicationId: "org",
        ancestors: ["组织管理"],
      },
      {
        path: "/departments",
        title: "部门",
        icon: "ep:office-building",
        applicationId: "org",
        ancestors: ["组织管理"],
      },
    ]);
  });

  it("菜单图标、标题及授权菜单集合变化后不保留旧配置", () => {
    const menus: MenuRouteRecord[] = [{ path: "/members", title: "成员", icon: "ep:user" }];
    const previous = workbenchEntries(menus, "/workbench");
    menus[0] = { path: "/members", title: "组织成员", icon: "ep:avatar" };
    const next = workbenchEntries(menus, "/workbench");
    expect(next[0]).toMatchObject({ title: "组织成员", icon: "ep:avatar" });
    expect(previous[0].icon).toBe("ep:user");
    expect(workbenchEntries([], "/workbench")).toEqual([]);
  });
});
