import type { InAdminPlugin } from "@ingot/admin-core";
import { securityPlugin } from "@ingot/security-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { createAppLocalPlugin } from "./app-plugin";

export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  securityPlugin,
  orgPlugin,
  createAppLocalPlugin(appCode),
];
