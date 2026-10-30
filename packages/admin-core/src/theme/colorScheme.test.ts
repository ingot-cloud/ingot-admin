import { effectScope, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveAdminColorSchemeDark,
  readAdminColorSchemePreference,
  ADMIN_COLOR_SCHEME_STORAGE_KEY,
  applyInitialColorScheme,
  useAdminColorScheme,
} from "./colorScheme";

describe("color scheme", () => {
  afterEach(() => {
    window.localStorage.removeItem(ADMIN_COLOR_SCHEME_STORAGE_KEY);
    document.documentElement.classList.remove("dark");
    vi.unstubAllGlobals();
  });
  it("显式 dark / light 不跟随系统", () => {
    expect(resolveAdminColorSchemeDark("dark")).toBe(true);
    expect(resolveAdminColorSchemeDark("light")).toBe(false);
  });

  it.each([null, "auto", '"auto"', "invalid"])(
    "系统为深色时，空或旧偏好 %s 仍初始化为 light",
    (stored) => {
      if (stored !== null) window.localStorage.setItem(ADMIN_COLOR_SCHEME_STORAGE_KEY, stored);
      vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: true })),
      );
      applyInitialColorScheme();
      expect(readAdminColorSchemePreference()).toBe("light");
      expect(window.localStorage.getItem(ADMIN_COLOR_SCHEME_STORAGE_KEY)).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    },
  );

  it("初始化不依赖开关组件，按存储键恢复 html.dark", () => {
    window.localStorage.setItem(ADMIN_COLOR_SCHEME_STORAGE_KEY, "dark");
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("light"),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    applyInitialColorScheme();
    expect(readAdminColorSchemePreference()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("手动选择与系统相同的深色时仍保存显式 dark，切回浅色保存 light", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const scope = effectScope();
    try {
      const dark = scope.run(useAdminColorScheme)!;
      expect(dark.value).toBe(false);
      dark.value = true;
      await nextTick();
      expect(window.localStorage.getItem(ADMIN_COLOR_SCHEME_STORAGE_KEY)).toBe("dark");
      dark.value = false;
      await nextTick();
      expect(window.localStorage.getItem(ADMIN_COLOR_SCHEME_STORAGE_KEY)).toBe("light");
    } finally {
      scope.stop();
    }
  });
});
