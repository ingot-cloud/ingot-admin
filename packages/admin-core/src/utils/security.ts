import { useAuthStore } from "@/stores/modules/auth";
import { clearAdminQueryCache } from "@/query";
import { useLogin } from "@/hooks/biz/useLogin";

/**
 * 退出登录，并且刷新页面
 */
export function logoutAndReload(ignoreRevokeAPI?: boolean) {
  clearAdminQueryCache();
  useAuthStore()
    .logout(ignoreRevokeAPI)
    .then(() => {
      useLogin().go();
    });
}
