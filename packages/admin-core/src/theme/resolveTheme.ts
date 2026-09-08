import { defaultAdminTheme } from "./defaultTheme";
import { defaultDarkTokens, defaultLightTokens } from "./defaultTokens";
import { assertAdminThemeShape } from "./defineAdminTheme";
import { IN_THEME_TOKEN_NAMES, type InThemeTokenOverrides, type InThemeTokens } from "./tokens";
import type { InAdminTheme, InResolvedAdminTheme } from "./types";

const knownTokenNames = new Set<string>(IN_THEME_TOKEN_NAMES);

export const assertKnownTokenKeys = (
  themeId: string,
  overrides: InThemeTokenOverrides | undefined,
): void => {
  if (!overrides) {
    return;
  }
  for (const key of Object.keys(overrides)) {
    if (!knownTokenNames.has(key)) {
      throw new Error(`主题 “${themeId}” 包含未知 Token “${key}”`);
    }
  }
};

export const mergeThemeTokens = (
  baseline: InThemeTokens,
  overrides?: InThemeTokenOverrides,
): InThemeTokens => ({
  ...baseline,
  ...overrides,
});

export const resolveAdminTheme = (theme?: InAdminTheme): InResolvedAdminTheme => {
  const source: InAdminTheme = theme ?? defaultAdminTheme;
  assertAdminThemeShape(source);
  assertKnownTokenKeys(source.id, source.tokens?.light);
  assertKnownTokenKeys(source.id, source.tokens?.dark);
  return {
    id: source.id,
    apiVersion: source.apiVersion,
    name: source.name,
    tokens: {
      light: mergeThemeTokens(defaultLightTokens, source.tokens?.light),
      dark: mergeThemeTokens(defaultDarkTokens, source.tokens?.dark),
    },
    shell: source.shell,
    parts: source.parts,
  };
};
