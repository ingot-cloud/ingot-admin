import { fileURLToPath } from "node:url";
import { defineInAppConfig, DEV_BFF_ALLOWED_HOSTS } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInAppConfig({
  rootDir,
  port: 5798,
  allowedHosts: [...DEV_BFF_ALLOWED_HOSTS],
  iconDir: fileURLToPath(new URL("../../packages/admin-core/src/assets/icons", import.meta.url)),
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
  enforceAppConventions: true,
  officialPlugins: ["@ingot/org-plugin", "@ingot/security-plugin"],
  iconifyOffline: {
    collections: ["ep"],
  },
  proxy: {
    "/api": {
      target: "http://localhost:7980",
      changeOrigin: false,
      rewrite: (path) => path.replace(/^\/api(?=\/|$)/, "") || "/",
    },
  },
  extend: {
    server: { allowedHosts: [...DEV_BFF_ALLOWED_HOSTS] },
    preview: { allowedHosts: [...DEV_BFF_ALLOWED_HOSTS] },
  },
});
