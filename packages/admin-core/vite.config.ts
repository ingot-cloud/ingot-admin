import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineInLibraryConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInLibraryConfig({
  rootDir,
  entry: path.resolve(rootDir, "src/index.ts"),
  name: "InAdminCore",
  aliases: {
    "@": path.resolve(rootDir, "src"),
    "@cmps": path.resolve(rootDir, "src/components"),
    "@models": path.resolve(rootDir, "src/models"),
    "@ingot/shared": path.resolve(rootDir, "../shared/src/index.ts"),
    "@ingot/shared/crypto": path.resolve(rootDir, "../shared/src/crypto/index.ts"),
    "@ingot/shared/hooks": path.resolve(rootDir, "../shared/src/hooks/index.ts"),
  },
  componentDirs: ["./src/components", "./src/layouts/widgets"],
  hookDirs: ["./src/hooks/**"],
  iconDir: "src/assets/icons",
  external: [
    "@ingot/shared",
    /^@ingot\/shared(?:\/|$)/,
    "@vue/shared",
    "@vueuse/core",
    /^element-plus(?:\/|$)/,
    "pinia",
    "pinia-plugin-persistedstate",
    /^vue(?:\/|$)/,
    /^vue-router(?:\/|$)/,
  ],
  extend: {
    test: {
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.ts"],
      server: {
        deps: {
          inline: ["element-plus", "vue3-tree-org"],
        },
      },
    },
  },
});
