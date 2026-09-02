import type { InAdminPlugin } from "@ingot/admin-core";
import { platformPlugin } from "@ingot/platform-plugin";
import { securityPlugin } from "@ingot/security-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { memberPlugin } from "@ingot/member-plugin";

export const adminPlugins: InAdminPlugin[] = [
  platformPlugin,
  securityPlugin,
  orgPlugin,
  memberPlugin,
];
