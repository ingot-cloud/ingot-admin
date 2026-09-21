import { fileURLToPath } from "node:url";
import { defineInSourcePluginConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInSourcePluginConfig({
  rootDir,
  aliases: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
  hookDirs: [],
  componentDirs: [],
});
