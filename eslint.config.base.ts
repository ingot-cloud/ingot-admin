import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * 基础 ESLint 配置
 * 适用于所有 TypeScript 项目（非 Vue）
 */
export const baseConfig = [
  globalIgnores([
    "**/dist/**",
    "**/dist-ssr/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/.temp/**",
    "**/.cache/**",
  ]),

  {
    name: "base/files-to-lint",
    files: ["**/*.{ts,mts,tsx}"],
    ...tseslint.configs.recommended[0],
    rules: {
      // TypeScript 推荐规则
      ...tseslint.configs.recommended[0].rules,
      // 通用规则
      "no-undef": "off", // TypeScript 已处理
    },
  },
];

export default baseConfig;
