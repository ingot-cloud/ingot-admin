import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "../../..");
const coreSrc = path.join(repoRoot, "packages/admin-core/src");

export default defineConfig({
  root: rootDir,
  base: "./",
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "@vueuse/core"],
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      "@": coreSrc,
    },
  },
  build: {
    outDir: path.resolve(rootDir, "../dist/demos"),
    emptyOutDir: true,
  },
});
