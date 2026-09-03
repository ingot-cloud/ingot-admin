import type { InAdminPlugin } from "@ingot/admin-core";
import { platformPlugin } from "@ingot/platform-plugin";
import { securityPlugin } from "@ingot/security-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { memberPlugin } from "@ingot/member-plugin";
import { createAppLocalPlugin } from "./app-plugin";

export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  platformPlugin,
  securityPlugin,
  orgPlugin,
  memberPlugin,
  createAppLocalPlugin(appCode),
];
