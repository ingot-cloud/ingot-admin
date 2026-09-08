import { useDark } from "@vueuse/core";

/** 与 VueUse `useDark` 默认存储键一致，保留跟随系统 / 显式偏好语义。 */
export const ADMIN_COLOR_SCHEME_STORAGE_KEY = "vueuse-color-scheme";

export type AdminColorSchemePreference = "auto" | "light" | "dark";

const parseStoredPreference = (raw: string | null): AdminColorSchemePreference => {
  if (raw == null || raw === "") {
    return "auto";
  }
  let value = raw;
  if (raw.startsWith('"') || raw.startsWith("'")) {
    try {
      value = JSON.parse(raw) as string;
    } catch {
      value = raw;
    }
  }
  if (value === "light" || value === "dark" || value === "auto") {
    return value;
  }
  return "auto";
};

export const readAdminColorSchemePreference = (): AdminColorSchemePreference => {
  if (typeof window === "undefined") {
    return "auto";
  }
  return parseStoredPreference(window.localStorage.getItem(ADMIN_COLOR_SCHEME_STORAGE_KEY));
};

export const resolveAdminColorSchemeDark = (
  preference: AdminColorSchemePreference,
  prefersDark: boolean,
): boolean => {
  if (preference === "dark") {
    return true;
  }
  if (preference === "light") {
    return false;
  }
  return prefersDark;
};

const prefersColorSchemeDark = (): boolean => {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const applyInitialColorScheme = (): void => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }
  const isDark = resolveAdminColorSchemeDark(
    readAdminColorSchemePreference(),
    prefersColorSchemeDark(),
  );
  document.documentElement.classList.toggle("dark", isDark);
};

export const useAdminColorScheme = () =>
  useDark({
    selector: "html",
    attribute: "class",
    valueDark: "dark",
    valueLight: "",
    storageKey: ADMIN_COLOR_SCHEME_STORAGE_KEY,
    initialValue: "auto",
  });
