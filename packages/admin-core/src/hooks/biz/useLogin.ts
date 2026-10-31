import {
  LOGIN_PATH,
  EXPLICIT_LOGOUT_QUERY_KEY,
  markExplicitLogout,
  saveReturnTo,
} from "@ingot/auth-core";

import { getAdminRuntimeConfig } from "@/runtime";

export type LoginGoOptions = {
  rememberReturnTo?: boolean;
  /** 显式再认证，保留当前会话但本次必须显示登录表单。 */
  forceLogin?: boolean;
};

let navigation: Promise<void> | undefined;

export const useLogin = () => {
  const go = (options?: LoginGoOptions): Promise<void> => {
    if (navigation) return navigation;
    navigation = Promise.resolve()
      .then(() => {
        const appId = getAdminRuntimeConfig().login.appId;
        const forceForm = options?.forceLogin || options?.rememberReturnTo === false;
        if (forceForm) markExplicitLogout(undefined, appId);
        if (options?.rememberReturnTo !== false)
          saveReturnTo(
            `${window.location.pathname}${window.location.search}${window.location.hash}`,
            undefined,
            appId,
          );
        window.location.assign(
          forceForm ? `${LOGIN_PATH}?${EXPLICIT_LOGOUT_QUERY_KEY}=1` : LOGIN_PATH,
        );
      })
      .catch((error: unknown) => {
        navigation = undefined;
        throw error;
      });
    return navigation;
  };

  return {
    go,
  };
};
