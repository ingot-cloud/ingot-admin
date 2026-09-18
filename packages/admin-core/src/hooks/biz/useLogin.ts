import { saveReturnTo } from "@ingot/auth-core";

export const useLogin = () => {
  const go = async () => {
    saveReturnTo(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    window.location.assign("/auth/start");
  };

  return {
    go,
  };
};
