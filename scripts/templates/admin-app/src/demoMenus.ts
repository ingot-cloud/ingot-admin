import { MenuType, defineStaticMenus, toViewPrefix } from "@ingot/admin-core";

export const createDemoMenus = (appCode: string) => {
  const prefix = toViewPrefix(appCode);
  const overviewKey = `${prefix}.demo.overview`;
  return defineStaticMenus([
    {
      name: "本地 Demo",
      path: "/demo",
      routeName: `${appCode}-local-demo-root`,
      menuType: MenuType.Directory,
      children: [
        {
          name: "概览",
          path: "/demo/overview",
          routeName: `${appCode}-local-demo-overview`,
          menuType: MenuType.Menu,
          viewPath: overviewKey,
        },
      ],
    },
  ]);
};
