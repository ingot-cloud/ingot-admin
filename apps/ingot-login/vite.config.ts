import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";

import { createHtmlPlugin } from "vite-plugin-html";
import postcssNesting from "postcss-nesting";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import Unocss from "unocss/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from "path";

// https://vitejs.dev/config/
// 参数 { mode, command, ssrBuild }
export default defineConfig(({ mode }) => {
  const getViteEnv = (target: string) => {
    return loadEnv(mode, process.cwd())[target];
  };
  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      createHtmlPlugin({
        inject: {
          data: {
            //将环境变量 VITE_APP_TITLE 赋值给 title 方便 html页面使用 title 获取系统标题
            title: getViteEnv("VITE_APP_TITLE"),
          },
        },
        // minify: true,
        // pages: [
        //   {
        //     filename: "challenge",
        //     entry: "/src/pages/oauth2/challenge/main.ts",
        //     template: "challenge.html",
        //     injectOptions: {
        //       data: {
        //         //将环境变量 VITE_APP_TITLE 赋值给 title 方便 html页面使用 title 获取系统标题
        //         title: getViteEnv("VITE_APP_TITLE"),
        //       },
        //     },
        //   },
        // ],
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [path.resolve(process.cwd(), "src/assets/icons")],
        // 指定symbolId格式
        symbolId: `${getViteEnv("VITE_APP_SYMBOL")}-[dir]-[name]`,
      }),
      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: ["vue", "vue/macros", "vue-router", "@vueuse/core", "pinia"],
        dirs: ["./src/hooks/**"],
        dts: "./auto-imports.d.ts",
        vueTemplate: true,
        resolvers: [ElementPlusResolver()],
      }),
      // https://github.com/antfu/vite-plugin-components
      Components({
        dts: "./components.d.ts",
        dirs: ["./src/components", "./src/layouts"],
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            prefix: "i",
            customCollections: [getViteEnv("VITE_APP_SYMBOL")],
          }),
        ],
      }),
      // https://github.com/antfu/unplugin-icons
      Icons({
        autoInstall: true,
        compiler: "vue3",
        defaultClass: "inline",
        customCollections: {
          [`${getViteEnv("VITE_APP_SYMBOL")}`]: FileSystemIconLoader("./src/assets/icons"),
        },
      }),
      // https://github.com/unocss/unocss
      Unocss(),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@cmps": fileURLToPath(new URL("./src/components", import.meta.url)),
        "@models": fileURLToPath(new URL("./src/models", import.meta.url)),
      },
    },
    css: {
      postcss: {
        plugins: [postcssNesting],
      },
    },
    server: {
      host: "0.0.0.0",
      port: 1798,
      proxy: {
        "/api": {
          target: "http://localhost:7980",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/"),
        },
      },
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
    },
  };
});
