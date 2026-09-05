import type { MenuRouteRecord } from "@/layouts";

export const sidebarNavigationFixture: MenuRouteRecord[] = [
  { path: "/overview", title: "概览", icon: "ep:home-filled" },
  {
    path: "/org",
    title: "组织与成员管理超长标题用于省略",
    icon: "ep:office-building",
    children: [
      { path: "/org/members", title: "成员", icon: "ep:user" },
      { path: "/org/dept", title: "部门", icon: "ep:folder" },
    ],
  },
  {
    path: "/security",
    title: "安全中心",
    icon: "ep:lock",
    children: [
      { path: "/security/policy", title: "访问策略" },
      { path: "/security/audit", title: "审计日志" },
    ],
  },
  ...Array.from({ length: 12 }, (_, index) => ({
    path: `/item-${index}`,
    title: `菜单项 ${index + 1}`,
    icon: "ep:menu",
  })),
];
