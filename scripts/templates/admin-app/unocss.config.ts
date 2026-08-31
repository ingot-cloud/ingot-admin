import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  transformerDirectives,
} from "unocss";
import presetWind3 from "@unocss/preset-wind3";
import { FileSystemIconLoader } from "@iconify/utils/lib/loader/node-loaders";

export default defineConfig({
  rules: [[/^line-height-(.+)$/, ([, d]) => ({ "line-height": `${+d / 4}rem` })]],
  shortcuts: [
    ["text-icon", "text-1.4em!"],
    ["color-fade", "text-gray-900:50 dark:text-gray-300:50"],
    ["img-resize", "resize max-w-full h-auto"],
  ],
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      collections: {
        carbon: () => import("@iconify-json/carbon/icons.json").then((i) => i.default),
        ep: () => import("@iconify-json/ep/icons.json").then((i) => i.default),
        mdi: () => import("@iconify-json/mdi/icons.json").then((i) => i.default),
        ingot: FileSystemIconLoader("../../packages/admin-core/src/assets/icons"),
      },
      scale: 1.4,
      warn: true,
    }),
    presetWebFonts({
      inlineImports: false,
      fonts: {
        sans: "DM Sans",
        serif: "DM Serif Display",
        mono: "DM Mono",
      },
    }),
  ],
  transformers: [transformerDirectives()],
});
