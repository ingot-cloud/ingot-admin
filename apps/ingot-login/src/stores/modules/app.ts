import type { LoginConfig } from "../types";

/**
 * 全局配置
 */
export const useAppStore = defineStore("app", () => {
  const now = new Date();
  const login = reactive<LoginConfig>({
    copyright: import.meta.env.VITE_APP_COPYRIGHT.replace("{0}", now.getFullYear() + ""),
    loginBanner: import.meta.env.VITE_APP_LOGIN_BANNER,
    errorImage: import.meta.env.VITE_APP_ERROR_IMAGE,
    title: import.meta.env.VITE_APP_LOGIN_TITLE,
    qrcodeTitle: import.meta.env.VITE_APP_LOGIN_QRCODE_TITLE,
    desc: import.meta.env.VITE_APP_LOGIN_DESC,
  });

  return {
    login,
  };
});
