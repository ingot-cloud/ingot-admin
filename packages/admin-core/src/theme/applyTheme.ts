import type { InResolvedAdminTheme } from "./types";
import type { InThemeTokens } from "./tokens";

export const ADMIN_THEME_STYLE_ID = "in-admin-theme-vars";
export const ADMIN_THEME_ATTR = "data-in-theme";

let boundTheme: InResolvedAdminTheme | undefined;

const tokensToCss = (tokens: InThemeTokens): string =>
  Object.entries(tokens)
    .map(([name, value]) => `${name}:${value};`)
    .join("");

export const bindAdminTheme = (theme: InResolvedAdminTheme | undefined): void => {
  boundTheme = theme;
};

export const getAdminResolvedTheme = (): InResolvedAdminTheme | undefined => boundTheme;

export const applyAdminTheme = (theme: InResolvedAdminTheme): void => {
  if (typeof document === "undefined") {
    bindAdminTheme(theme);
    return;
  }
  document.documentElement.setAttribute(ADMIN_THEME_ATTR, theme.id);
  let style = document.getElementById(ADMIN_THEME_STYLE_ID);
  if (!(style instanceof HTMLStyleElement)) {
    style = document.createElement("style");
    style.id = ADMIN_THEME_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent =
    `html[${ADMIN_THEME_ATTR}="${theme.id}"]{${tokensToCss(theme.tokens.light)}}` +
    `html.dark[${ADMIN_THEME_ATTR}="${theme.id}"]{${tokensToCss(theme.tokens.dark)}}`;
  bindAdminTheme(theme);
};

export const resetAdminThemeDom = (): void => {
  bindAdminTheme(undefined);
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.removeAttribute(ADMIN_THEME_ATTR);
  document.getElementById(ADMIN_THEME_STYLE_ID)?.remove();
};
