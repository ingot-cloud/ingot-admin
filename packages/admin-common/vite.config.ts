import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineInLibraryConfig } from "@ingot/vite-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineInLibraryConfig({
  rootDir,
  entry: path.resolve(rootDir, "src/index.ts"),
  name: "InAdminCommon",
  aliases: {
    "@": path.resolve(rootDir, "src"),
  },
  componentDirs: ["./src/components"],
  hookDirs: [],
  iconDir: "src/assets/icons",
  external: [
    "@ingot/admin-core",
    /^@ingot\/admin-core(?:\/|$)/,
    "@tanstack/vue-query",
    /^@tanstack\/vue-query(?:\/|$)/,
    /^element-plus(?:\/|$)/,
    /^vue(?:\/|$)/,
  ],
  extend: {
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.ts"],
    },
  },
});
