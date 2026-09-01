import { fileURLToPath } from "node:url";
import { defineInAppConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInAppConfig({
  rootDir,
  port: 1798,
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "@cmps": fileURLToPath(new URL("./src/components", import.meta.url)),
    "@models": fileURLToPath(new URL("./src/models", import.meta.url)),
  },
  proxy: {
    "/api": {
      target: "http://localhost:7980",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api(?=\/|$)/, "") || "/",
    },
  },
});
