import type { InAdminPlugin } from "@ingot/admin-core";
import { orgPlugin } from "@ingot/org-plugin";
import { createAppLocalPlugin } from "./app-plugin";

export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  orgPlugin,
  createAppLocalPlugin(appCode),
];
