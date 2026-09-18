import Http from "@/net";
import type { R } from "@/models";
import { createAuthApi } from "@ingot/auth-core";
import { getAdminRuntimeConfig } from "@/runtime";

export const bffAuthApi = () => createAuthApi(Http, getAdminRuntimeConfig().login.entry);

/**
 * 撤销当前应用会话
 */
export function LogoutAPI(): Promise<R> {
  return bffAuthApi().logout();
}
