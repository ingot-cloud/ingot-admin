import { afterEach, describe, expect, it } from "vitest";
import {
  resolveAdminColorSchemeDark,
  readAdminColorSchemePreference,
  ADMIN_COLOR_SCHEME_STORAGE_KEY,
  applyInitialColorScheme,
} from "./colorScheme";

describe("color scheme", () => {
  afterEach(() => {
    window.localStorage.removeItem(ADMIN_COLOR_SCHEME_STORAGE_KEY);
    document.documentElement.classList.remove("dark");
  });
  it("显式 dark / light 不跟随系统", () => {
    expect(resolveAdminColorSchemeDark("dark", false)).toBe(true);
    expect(resolveAdminColorSchemeDark("light", true)).toBe(false);
  });

  it("auto 跟随系统偏好", () => {
    expect(resolveAdminColorSchemeDark("auto", true)).toBe(true);
    expect(resolveAdminColorSchemeDark("auto", false)).toBe(false);
  });

  it("初始化不依赖开关组件，按存储键恢复 html.dark", () => {
    window.localStorage.setItem(ADMIN_COLOR_SCHEME_STORAGE_KEY, "dark");
    window.matchMedia = ((query: string) => ({
      matches: query.includes("light"),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    applyInitialColorScheme();
    expect(readAdminColorSchemePreference()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
