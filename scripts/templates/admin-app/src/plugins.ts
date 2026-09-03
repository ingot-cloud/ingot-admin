import type { InAdminPlugin } from "@ingot/admin-core";
import { createAppLocalPlugin } from "./app-plugin";
import { createDemoMenus } from "./demoMenus";

export const createAppPlugins = (appCode: string): InAdminPlugin[] => {
  const plugins: InAdminPlugin[] = [];
  plugins.push(createAppLocalPlugin(appCode, { staticMenus: createDemoMenus(appCode) }));
  return plugins;
};
