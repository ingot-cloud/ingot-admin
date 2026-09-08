export { INGOT_ADMIN_THEME_API_VERSION } from "./types";
export type {
  InAdminTheme,
  InAdminThemeParts,
  InAdminThemePartName,
  InAdminThemeShellSlotName,
  InAdminThemeTokensConfig,
  InResolvedAdminTheme,
} from "./types";
export {
  IN_THEME_TOKEN_NAMES,
  type InThemeTokenName,
  type InThemeTokenOverrides,
  type InThemeTokens,
} from "./tokens";
export { defineAdminTheme } from "./defineAdminTheme";
export { defaultAdminTheme } from "./defaultTheme";
export { resolveAdminTheme, mergeThemeTokens } from "./resolveTheme";
export {
  ADMIN_THEME_ATTR,
  ADMIN_THEME_STYLE_ID,
  applyAdminTheme,
  getAdminResolvedTheme,
  resetAdminThemeDom,
} from "./applyTheme";
export {
  ADMIN_COLOR_SCHEME_STORAGE_KEY,
  applyInitialColorScheme,
  useAdminColorScheme,
} from "./colorScheme";
export { adminResolvedThemeKey, useAdminTheme, type InAdminThemeApi } from "./useAdminTheme";
export {
  adminShellKey,
  createAdminShell,
  provideAdminShell,
  useAdminShell,
  type InAdminShellApi,
} from "./useAdminShell";
export { default as InAdminThemeLayout } from "./InAdminThemeLayout.vue";
export { default as DefaultAdminShell } from "./DefaultAdminShell.vue";
