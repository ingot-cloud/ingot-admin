import type { Component } from "vue";
import type { InThemeTokenOverrides, InThemeTokens } from "./tokens";

/** 主题协议版本。不匹配时在挂载前拒绝加载。 */
export const INGOT_ADMIN_THEME_API_VERSION = 1 as const;

export type InAdminThemePartName = "header" | "navigation" | "breadcrumb" | "footer";

export type InAdminThemeShellSlotName =
  "header" | "navigation" | "breadcrumb" | "content" | "footer";

export interface InAdminThemeParts {
  header?: Component;
  navigation?: Component;
  breadcrumb?: Component;
  footer?: Component;
}

export interface InAdminThemeTokensConfig {
  light?: InThemeTokenOverrides;
  dark?: InThemeTokenOverrides;
}

export interface InAdminTheme {
  id: string;
  apiVersion: typeof INGOT_ADMIN_THEME_API_VERSION;
  name: string;
  tokens?: InAdminThemeTokensConfig;
  shell?: Component;
  parts?: InAdminThemeParts;
}

export interface InResolvedAdminTheme {
  id: string;
  apiVersion: typeof INGOT_ADMIN_THEME_API_VERSION;
  name: string;
  tokens: {
    light: InThemeTokens;
    dark: InThemeTokens;
  };
  shell?: Component;
  parts?: InAdminThemeParts;
}
