import { describe, expect, it } from "vitest";
import type { MenuRouteRecord } from "@/layouts";
import { filterMenusByName, flattenMenus } from "./flattenMenus";

const menus: MenuRouteRecord[] = [
  { path: "/overview", title: "概览", icon: "ep:home-filled" },
  {
    path: "/security",
    title: "安全中心",
    icon: "ep:lock",
    children: [
      { path: "/security/members", title: "成员权限", icon: "ep:user" },
      { path: "/security/audit", title: "审计日志" },
      { path: "/security/empty", title: "  " },
      { path: "/security/overview", title: "Overview" },
    ],
  },
  {
    path: "/hidden-parent",
    children: [{ path: "/hidden-parent/leaf", title: "无父标题叶子" }],
  },
  {
    path: "/folder",
    title: "空分组",
    children: [],
  },
];

describe("flattenMenus", () => {
  it("只保留有 path 与 title 的叶子，并带上祖先标题", () => {
    expect(flattenMenus(menus)).toEqual([
      { path: "/overview", title: "概览", icon: "ep:home-filled", ancestors: [] },
      {
        path: "/security/members",
        title: "成员权限",
        icon: "ep:user",
        ancestors: ["安全中心"],
      },
      { path: "/security/audit", title: "审计日志", icon: undefined, ancestors: ["安全中心"] },
      {
        path: "/security/overview",
        title: "Overview",
        icon: undefined,
        ancestors: ["安全中心"],
      },
      { path: "/hidden-parent/leaf", title: "无父标题叶子", icon: undefined, ancestors: [] },
      { path: "/folder", title: "空分组", icon: undefined, ancestors: [] },
    ]);
  });
});

describe("filterMenusByName", () => {
  const items = flattenMenus(menus);

  it("空关键词返回空列表", () => {
    expect(filterMenusByName(items, "  ")).toEqual([]);
  });

  it("按叶子标题匹配，忽略大小写", () => {
    expect(filterMenusByName(items, "审计").map((item) => item.path)).toEqual([
      "/security/audit",
    ]);
    expect(filterMenusByName(items, "OVERVIEW").map((item) => item.title)).toEqual(["Overview"]);
  });

  it("祖先标题也可命中", () => {
    expect(filterMenusByName(items, "安全").map((item) => item.path)).toEqual([
      "/security/members",
      "/security/audit",
      "/security/overview",
    ]);
  });
});
