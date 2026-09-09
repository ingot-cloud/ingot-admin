import { defineAdminTheme, INGOT_ADMIN_THEME_API_VERSION } from "@ingot/admin-core";

export const fixtureNebulaTheme = defineAdminTheme({
  id: "fixture-nebula",
  apiVersion: INGOT_ADMIN_THEME_API_VERSION,
  name: "星云夹具-fixture-nebula-unique-marker",
  tokens: {
    light: {
      "--in-color-primary": "#0369a1",
    },
  },
});
