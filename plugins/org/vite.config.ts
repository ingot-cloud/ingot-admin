import { fileURLToPath } from "node:url";
import { defineInSourcePluginConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInSourcePluginConfig({
  rootDir,
  iconDir: fileURLToPath(new URL("../../packages/admin-core/src/assets/icons", import.meta.url)),
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
  hookDirs: [],
});
