import { loadEnv, mergeConfig } from "vite";
import type { ConfigEnv, UserConfig } from "vite";
import { createSharedViteConfig } from "./shared.js";
import type { InAppViteOptions } from "./types.js";

export type InViteConfigFactory = (env: ConfigEnv) => UserConfig;

export const defineInAppConfig = (options: InAppViteOptions): InViteConfigFactory => {
  return ({ mode }) => {
    const env = loadEnv(mode, options.rootDir);
    const symbol = env.VITE_APP_SYMBOL || "ingot";
    const shared = createSharedViteConfig(options, symbol);
    const config = mergeConfig(shared.config, {
      plugins: shared.plugins,
      server: {
        host: options.host ?? "0.0.0.0",
        port: options.port,
        proxy: options.proxy,
      },
      build: {
        outDir: "dist",
        rolldownOptions: {
          output: {
            chunkFileNames: "static/js/[name]-[hash].js",
            entryFileNames: "static/js/[name]-[hash].js",
            assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          },
        },
      },
    });

    return mergeConfig(config, options.extend ?? {});
  };
};
