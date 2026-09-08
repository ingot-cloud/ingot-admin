import { defineAdminTheme } from "./defineAdminTheme";
import { defaultDarkTokens, defaultLightTokens } from "./defaultTokens";
import { INGOT_ADMIN_THEME_API_VERSION, type InAdminTheme } from "./types";

export const defaultAdminTheme: InAdminTheme = defineAdminTheme({
  id: "default",
  apiVersion: INGOT_ADMIN_THEME_API_VERSION,
  name: "默认主题",
  tokens: {
    light: defaultLightTokens,
    dark: defaultDarkTokens,
  },
});
