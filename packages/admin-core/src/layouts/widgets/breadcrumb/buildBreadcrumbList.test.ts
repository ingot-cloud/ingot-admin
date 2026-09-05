import { describe, expect, it } from "vitest";
import { buildBreadcrumbList, isBreadcrumbVisible } from "./buildBreadcrumbList";

describe("buildBreadcrumbList", () => {
  it("仅一层时长度为 1，不视为可见面包屑", () => {
    const list = buildBreadcrumbList([{ path: "/users", meta: { title: "用户管理" } }]);
    expect(list).toHaveLength(1);
    expect(isBreadcrumbVisible(true, [{ path: "/users", meta: { title: "用户管理" } }])).toBe(false);
  });

  it("两层以上且开关开启时可见", () => {
    const matched = [
      { path: "/platform", meta: { title: "平台配置" } },
      { path: "/platform/app", meta: { title: "应用管理" } },
    ];
    expect(buildBreadcrumbList(matched)).toHaveLength(2);
    expect(isBreadcrumbVisible(true, matched)).toBe(true);
    expect(isBreadcrumbVisible(false, matched)).toBe(false);
  });

  it("hideBreadcrumb 的匹配段不进入列表", () => {
    const matched = [
      { path: "/", meta: { hideBreadcrumb: true } },
      { path: "/users", meta: { title: "用户管理" } },
    ];
    expect(buildBreadcrumbList(matched)).toHaveLength(1);
    expect(isBreadcrumbVisible(true, matched)).toBe(false);
  });

  it("仅重定向到唯一子级时折叠成一层，同样不可见", () => {
    const matched = [
      {
        path: "/org",
        meta: { title: "组织", icon: "org" },
        redirect: "/org/users",
        children: [{ path: "/org/users", meta: { title: "用户" } }],
      },
      { path: "/org/users", meta: { title: "用户" } },
    ];
    const list = buildBreadcrumbList(matched);
    expect(list).toHaveLength(1);
    expect(list[0].icon).toBe("org");
    expect(isBreadcrumbVisible(true, matched)).toBe(false);
  });
});
