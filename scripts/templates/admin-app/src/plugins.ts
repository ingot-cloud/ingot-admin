import type { InAdminPlugin } from "@ingot/admin-core";
import { createTargetPlugin } from "./plugins/targetPlugin";

export const createAppPlugins = (appCode: string): InAdminPlugin[] => {
  const plugins: InAdminPlugin[] = [];
  plugins.push(createTargetPlugin(appCode));
  return plugins;
};
