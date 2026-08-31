import { fileURLToPath } from "node:url";
import { defineIngotAppConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineIngotAppConfig({
  rootDir,
  port: {{port}},
  iconDir: fileURLToPath(new URL("../../packages/admin-core/src/assets/icons", import.meta.url)),
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "@ingot/utils": fileURLToPath(new URL("../../packages/utils/src/index.ts", import.meta.url)),
    "@ingot/hooks": fileURLToPath(new URL("../../packages/hooks/src/index.ts", import.meta.url)),
    "@ingot/crypto": fileURLToPath(new URL("../../packages/crypto/src/index.ts", import.meta.url)),
  },
  proxy: {
    "/api": {
      target: "http://localhost:7980",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api(?=\/|$)/, "") || "/",
    },
  },
});
