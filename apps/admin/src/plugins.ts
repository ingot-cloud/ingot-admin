import { createSameOriginAuthSession, type InAdminPlugin } from "@ingot/admin-core";
import { createAuthPlugin } from "@ingot/auth-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { createHelpPlugin } from "@ingot/help-plugin";
import { createAppLocalPlugin } from "./app-plugin";

export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  createAuthPlugin(createSameOriginAuthSession),
  orgPlugin,
  createHelpPlugin({
    entry: "tenant",
    loadContent: () => import("./help/content").then((module) => module.default),
  }),
  createAppLocalPlugin(appCode),
];
