import { fileURLToPath } from "node:url";
import { defineInAppConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInAppConfig({
  rootDir,
  port: 5799,
  iconDir: fileURLToPath(new URL("../../packages/admin-core/src/assets/icons", import.meta.url)),
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "@ingot/admin-app/plugin": fileURLToPath(new URL("../admin/src/plugin.ts", import.meta.url)),
    "@ingot/admin-app": fileURLToPath(new URL("../admin/src/plugin.ts", import.meta.url)),
  },
  proxy: {
    "/api": {
      target: "http://localhost:7980",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api(?=\/|$)/, "") || "/",
    },
  },
});
