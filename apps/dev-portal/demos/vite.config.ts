import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import UnoCSS from "unocss/vite";
import { transformerDirectives } from "unocss";
import presetWind3 from "@unocss/preset-wind3";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "../../..");
const coreSrc = path.join(repoRoot, "packages/admin-core/src");

export default defineConfig({
  root: rootDir,
  base: "./",
  plugins: [
    vue(),
    UnoCSS({
      configFile: false,
      presets: [presetWind3()],
      transformers: [transformerDirectives()],
    }),
    AutoImport({
      imports: ["vue", "@vueuse/core"],
      dts: false,
    }),
  ],
  resolve: {
    alias: [
      // 演示站不接入 iconify 离线虚拟模块，InIcon 以静态编辑图标替代。
      { find: /^\.\.\/InIcon\.vue$/, replacement: path.join(rootDir, "stubs/InIconStub.vue") },
      { find: "@", replacement: coreSrc },
    ],
  },
  build: {
    outDir: path.resolve(rootDir, "../dist/demos"),
    emptyOutDir: true,
  },
});
