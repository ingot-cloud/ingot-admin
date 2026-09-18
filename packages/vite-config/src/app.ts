import { loadEnv, mergeConfig } from "vite";
import type { ConfigEnv, UserConfig } from "vite";
import { createSharedViteConfig } from "./shared.js";
import type { InAppViteOptions } from "./types.js";

export type InViteConfigFactory = (env: ConfigEnv) => UserConfig;

export type InAppViteOptionsFactory = (env: ConfigEnv) => InAppViteOptions;

/** 本机 DEV 四站点；Vite DNS rebinding 默认只放行 localhost / *.localhost。 */
export const DEV_BFF_ALLOWED_HOSTS = [
  "tenant.local",
  "tenant-login.local",
  "platform.local",
  "platform-login.local",
];

export const defineInAppConfig = (
  options: InAppViteOptions | InAppViteOptionsFactory,
): InViteConfigFactory => {
  return (configEnv) => {
    const resolved = typeof options === "function" ? options(configEnv) : options;
    const env = loadEnv(configEnv.mode, resolved.rootDir);
    const symbol = env.VITE_APP_SYMBOL || "ingot";
    const shared = createSharedViteConfig(resolved, symbol);
    const host = resolved.host ?? "0.0.0.0";
    const allowedHosts = resolved.allowedHosts ?? DEV_BFF_ALLOWED_HOSTS;
    const config = mergeConfig(shared.config, {
      plugins: shared.plugins,
      base: resolved.base ?? "/",
      server: {
        host,
        port: resolved.port,
        proxy: resolved.proxy,
        allowedHosts,
      },
      preview: {
        host,
        port: resolved.port,
        allowedHosts,
      },
      build: {
        outDir: resolved.outDir ?? "dist",
        rolldownOptions: {
          output: {
            chunkFileNames: "static/js/[name]-[hash].js",
            entryFileNames: "static/js/[name]-[hash].js",
            assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          },
        },
      },
    });

    return mergeConfig(config, resolved.extend ?? {});
  };
};
