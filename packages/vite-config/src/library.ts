import { mergeConfig } from "vite";
import type { UserConfigExport } from "vite";
import { createSharedViteConfig } from "./shared.js";
import type { InLibraryViteOptions } from "./types.js";
import { ICONIFY_ICON_ID, ICONIFY_OFFLINE_ID } from "./iconify-offline.js";

export const defineInLibraryConfig = (options: InLibraryViteOptions): UserConfigExport => {
  const shared = createSharedViteConfig(
    {
      ...options,
      enableDevTools: false,
      externalizeIconifyOffline: true,
    },
    "ingot",
  );
  const config = mergeConfig(shared.config, {
    plugins: shared.plugins,
    build: {
      outDir: "dist",
      minify: false,
      lib: {
        entry: options.entry,
        name: options.name,
        formats: ["es"],
        fileName: options.fileName ?? "index",
        cssFileName: "style",
      },
      rolldownOptions: {
        external: [...(options.external ?? []), ICONIFY_OFFLINE_ID, ICONIFY_ICON_ID],
        output: {
          assetFileNames: "[name][extname]",
        },
      },
    },
  });

  return mergeConfig(config, options.extend ?? {});
};
