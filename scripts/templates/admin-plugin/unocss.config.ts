import {
  defineConfig,
  presetAttributify,
  presetIcons,
  transformerDirectives,
} from "unocss";
import presetWind3 from "@unocss/preset-wind3";
import { FileSystemIconLoader } from "@iconify/utils/lib/loader/node-loaders";

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      collections: {
        ep: () => import("@iconify-json/ep/icons.json").then((i) => i.default),
        ingot: FileSystemIconLoader("../../packages/admin-core/src/assets/icons"),
      },
      scale: 1.4,
      warn: true,
    }),
  ],
  transformers: [transformerDirectives()],
});
