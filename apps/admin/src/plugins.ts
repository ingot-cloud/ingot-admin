import { createSameOriginAuthSession, type InAdminPlugin } from "@ingot/admin-core";
import { createAuthPlugin } from "@ingot/auth-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { createAppLocalPlugin } from "./app-plugin";

export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  createAuthPlugin(createSameOriginAuthSession),
  orgPlugin,
  createAppLocalPlugin(appCode),
];
