import { createSameOriginAuthSession, type InAdminPlugin } from "@ingot/admin-core";
import { createAuthPlugin } from "@ingot/auth-plugin";
import { platformPlugin } from "@ingot/platform-plugin";
import { securityPlugin } from "@ingot/security-plugin";
import { createAppLocalPlugin } from "./app-plugin";

export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  createAuthPlugin(createSameOriginAuthSession),
  platformPlugin,
  securityPlugin,
  createAppLocalPlugin(appCode),
];
