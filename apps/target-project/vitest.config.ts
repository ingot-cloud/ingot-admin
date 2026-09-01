import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import type { Plugin } from "vite";
import viteConfig from "./vite.config.ts";

const stubAssetPlugin = (): Plugin => ({
  name: "stub-css-and-virtual-assets",
  enforce: "pre",
  resolveId(id) {
    if (id.endsWith(".css") || id === "virtual:svg-icons-register" || id === "uno.css") {
      return `\0stub:${id}`;
    }
    return undefined;
  },
  load(id) {
    if (id.startsWith("\0stub:")) {
      return "export default {}";
    }
    return undefined;
  },
});

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      plugins: [stubAssetPlugin()],
      test: {
        environment: "jsdom",
        exclude: [...configDefaults.exclude, "e2e/**"],
        root: fileURLToPath(new URL("./", import.meta.url)),
        server: {
          deps: {
            inline: ["@ingot/admin-core", "@ingot/admin-app", "element-plus"],
          },
        },
      },
    }),
  ),
);
