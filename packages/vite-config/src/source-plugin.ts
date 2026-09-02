import { mergeConfig } from "vite";
import type { InViteConfigFactory } from "./app.js";
import { createSharedViteConfig } from "./shared.js";
import type { InViteBaseOptions } from "./types.js";

/**
 * 源码插件的 Vite 配置：提供 Vue/SFC、alias、UnoCSS、自动导入与 Vitest 转换，
 * 不提供 dev server 端口和 production build entry。
 */
export const defineInSourcePluginConfig = (options: InViteBaseOptions): InViteConfigFactory => {
  return () => {
    const shared = createSharedViteConfig(
      {
        ...options,
        enableDevTools: false,
      },
      "ingot",
    );
    const config = mergeConfig(shared.config, {
      plugins: shared.plugins,
    });
    return mergeConfig(config, options.extend ?? {});
  };
};
