import { markExplicitLogout, saveReturnTo } from "@ingot/auth-core";

export type LoginGoOptions = {
  rememberReturnTo?: boolean;
};

export const useLogin = () => {
  const go = async (options?: LoginGoOptions) => {
    if (options?.rememberReturnTo === false) {
      markExplicitLogout();
    } else {
      saveReturnTo(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
    window.location.assign("/auth/start");
  };

  return {
    go,
  };
};
