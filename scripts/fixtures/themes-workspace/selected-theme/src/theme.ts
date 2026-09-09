import { defineAdminTheme, INGOT_ADMIN_THEME_API_VERSION } from "@ingot/admin-core";

export const fixtureAuroraTheme = defineAdminTheme({
  id: "fixture-aurora",
  apiVersion: INGOT_ADMIN_THEME_API_VERSION,
  name: "极光夹具",
  tokens: {
    light: {
      "--in-color-primary": "#7c3aed",
    },
  },
});
