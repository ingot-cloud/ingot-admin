import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [vue()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: path.resolve(rootDir, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["vue", "@ingot/admin-core", /^@ingot\/admin-core(?:\/|$)/],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "style.css";
          }
          return assetInfo.name ?? "asset";
        },
      },
    },
  },
});
