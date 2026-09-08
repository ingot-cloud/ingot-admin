// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  applyAdminTheme,
  ADMIN_THEME_ATTR,
  ADMIN_THEME_STYLE_ID,
  resetAdminThemeDom,
} from "./applyTheme";
import { resolveAdminTheme } from "./resolveTheme";
import { defineAdminTheme } from "./defineAdminTheme";
import { INGOT_ADMIN_THEME_API_VERSION } from "./types";

describe("applyAdminTheme", () => {
  afterEach(() => {
    resetAdminThemeDom();
  });

  it("在 html 写入主题标识并通过受控样式节点输出浅深色覆盖", () => {
    const theme = resolveAdminTheme(
      defineAdminTheme({
        id: "acme-brand",
        apiVersion: INGOT_ADMIN_THEME_API_VERSION,
        name: "品牌",
        tokens: {
          light: { "--in-color-primary": "#0f766e" },
          dark: { "--in-color-primary": "#2dd4bf" },
        },
      }),
    );
    applyAdminTheme(theme);
    expect(document.documentElement.getAttribute(ADMIN_THEME_ATTR)).toBe("acme-brand");
    const style = document.getElementById(ADMIN_THEME_STYLE_ID);
    expect(style).toBeInstanceOf(HTMLStyleElement);
    expect(style?.textContent).toContain('html[data-in-theme="acme-brand"]');
    expect(style?.textContent).toContain('html.dark[data-in-theme="acme-brand"]');
    expect(style?.textContent).toContain("--in-color-primary:#0f766e;");
    expect(style?.textContent).toContain("--in-color-primary:#2dd4bf;");
  });
});
