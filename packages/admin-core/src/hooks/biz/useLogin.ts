import { useAppStore } from "@/stores/modules/app";

export const useLogin = () => {
  const go = async () => {
    const { app } = useAppStore();

    const uri =
      `${app.login.loginUri}` +
      `?redirect_uri=${app.login.loginCallbackUri}`;

    window.location.href = uri;
  };

  return {
    go,
  };
};
