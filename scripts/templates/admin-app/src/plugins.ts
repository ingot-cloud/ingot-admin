import type { InAdminPlugin } from "@ingot/admin-core";
import { targetPlugin } from "./plugins/targetPlugin";

export const appPlugins: InAdminPlugin[] = [targetPlugin];
