import presetWind3 from "@unocss/preset-wind3";
import { FileSystemIconLoader } from "@iconify/utils/lib/loader/node-loaders";
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  rules: [[/^line-height-(.+)$/, ([, value]) => ({ "line-height": `${+value / 4}rem` })]],
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
        carbon: () => import("@iconify-json/carbon/icons.json").then((item) => item.default),
        ep: () => import("@iconify-json/ep/icons.json").then((item) => item.default),
        mdi: () => import("@iconify-json/mdi/icons.json").then((item) => item.default),
        ingot: FileSystemIconLoader("./src/assets/icons"),
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
