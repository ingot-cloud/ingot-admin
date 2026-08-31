import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";

/**
 * 基础 ESLint 配置
 * 适用于所有 TypeScript 项目（非 Vue）
 */
export const baseConfig: Linter.Config[] = [
  globalIgnores([
    "**/dist/**",
    "**/dist-ssr/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/public/**",
    "**/auto-imports.d.ts",
    "**/components.d.ts",
    "**/.temp/**",
    "**/.cache/**",
  ]),

  {
    name: "base/files-to-lint",
    files: ["**/*.{ts,mts,tsx}"],
    ...tseslint.configs.recommended[0],
    languageOptions: {
      parser: tseslint.parser,
      sourceType: "module",
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript 推荐规则
      ...tseslint.configs.recommended[0].rules,
      // 通用规则
      "no-undef": "off", // TypeScript 已处理
      // 历史类型债务先作为告警，避免工具链升级演变成全仓重构。
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unnecessary-type-constraint": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
    },
  },
];

export default baseConfig;
