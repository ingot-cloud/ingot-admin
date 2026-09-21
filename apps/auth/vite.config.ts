import { fileURLToPath } from "node:url";
import { defineInAppConfig, DEV_BFF_ALLOWED_HOSTS } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInAppConfig({
  rootDir,
  officialPlugins: ["@ingot/auth-plugin"],
  port: 1798,
  allowedHosts: [...DEV_BFF_ALLOWED_HOSTS],
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "@cmps": fileURLToPath(new URL("./src/components", import.meta.url)),
    "@models": fileURLToPath(new URL("./src/models", import.meta.url)),
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
