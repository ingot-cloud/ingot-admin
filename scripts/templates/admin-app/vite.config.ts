import { fileURLToPath } from "node:url";
import { defineInAppConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInAppConfig({
  rootDir,
  port: {{port}},
  iconDir: fileURLToPath(new URL("../../packages/admin-core/src/assets/icons", import.meta.url)),
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
  proxy: {
    "/api": {
      target: "http://localhost:7980",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api(?=\/|$)/, "") || "/",
    },
  },
});
