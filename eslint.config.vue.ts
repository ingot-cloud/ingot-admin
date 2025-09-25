import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import pluginVitest from "@vitest/eslint-plugin";
import pluginPlaywright from "eslint-plugin-playwright";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import type { Linter } from "eslint";

/**
 * Vue 应用 ESLint 配置
 */
export const vueConfig: Linter.Config[] = defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/__tests__/*"],
  },

  {
    ...pluginPlaywright.configs["flat/recommended"],
    files: ["e2e/**/*.{test,spec}.{js,ts,jsx,tsx}"],
  },
  skipFormatting,
  {
    rules: {
      // 使用auto-imports，关闭no-undef
      "no-undef": "off",
    },
  },
) as Linter.Config[];

export default vueConfig;
