import { useAuthStore } from "@/stores/modules/auth";
import { useLogin } from "@/hooks/biz/useLogin";

let navigation: Promise<void> | undefined;

/**
 * 退出登录，并且刷新页面
 */
export function logoutAndReload(ignoreRevokeAPI?: boolean): Promise<void> {
  if (navigation) return navigation;
  navigation = useAuthStore()
    .logout(ignoreRevokeAPI)
    .then(() => {
      return useLogin().go({ rememberReturnTo: Boolean(ignoreRevokeAPI), forceLogin: true });
    })
    .catch((error: unknown) => {
      navigation = undefined;
      throw error;
    });
  return navigation;
}
