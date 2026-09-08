import { defineAdminTheme, INGOT_ADMIN_THEME_API_VERSION } from "@ingot/admin-core";
import HorizonHeader from "./HorizonHeader.vue";
import HorizonShell from "./HorizonShell.vue";

export const exampleHorizonTheme = defineAdminTheme({
  id: "example-horizon",
  apiVersion: INGOT_ADMIN_THEME_API_VERSION,
  name: "地平线",
  tokens: {
    light: {
      "--in-color-primary": "#0f766e",
      "--in-blue-500": "#0f766e",
      "--in-blue-600": "#0d9488",
      "--in-radius-control": "10px",
      "--in-radius-card": "14px",
    },
    dark: {
      "--in-color-primary": "#2dd4bf",
      "--in-blue-500": "#2dd4bf",
      "--in-blue-600": "#5eead4",
      "--in-radius-control": "10px",
      "--in-radius-card": "14px",
    },
  },
  shell: HorizonShell,
  parts: {
    header: HorizonHeader,
  },
});
