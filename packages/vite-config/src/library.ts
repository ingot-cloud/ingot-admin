import { mergeConfig } from "vite";
import type { UserConfigExport } from "vite";
import { createSharedViteConfig } from "./shared.js";
import type { InLibraryViteOptions } from "./types.js";

export const defineInLibraryConfig = (options: InLibraryViteOptions): UserConfigExport => {
  const shared = createSharedViteConfig(
    {
      ...options,
      enableDevTools: false,
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
        external: options.external,
        output: {
          assetFileNames: "[name][extname]",
        },
      },
    },
  });

  return mergeConfig(config, options.extend ?? {});
};
