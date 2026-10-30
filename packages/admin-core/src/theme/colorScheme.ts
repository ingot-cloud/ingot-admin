import { computed } from "vue";
import { useColorMode, useStorage } from "@vueuse/core";

/** 沿用 VueUse 存储键；默认浅色，旧 auto 偏好归一为浅色。 */
export const ADMIN_COLOR_SCHEME_STORAGE_KEY = "vueuse-color-scheme";

export type AdminColorSchemePreference = "light" | "dark";

const parseStoredPreference = (raw: string | null): AdminColorSchemePreference => {
  if (raw === null || raw === "") {
    return "light";
  }
  let value = raw;
  if (raw.startsWith('"') || raw.startsWith("'")) {
    try {
      value = JSON.parse(raw) as string;
    } catch {
      value = raw;
    }
  }
  if (value === "light" || value === "dark") {
    return value;
  }
  return "light";
};

export const readAdminColorSchemePreference = (): AdminColorSchemePreference => {
  if (typeof window === "undefined") {
    return "light";
  }
  return parseStoredPreference(window.localStorage.getItem(ADMIN_COLOR_SCHEME_STORAGE_KEY));
};

export const resolveAdminColorSchemeDark = (preference: AdminColorSchemePreference): boolean =>
  preference === "dark";

export const applyInitialColorScheme = (): void => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }
  const preference = readAdminColorSchemePreference();
  window.localStorage.setItem(ADMIN_COLOR_SCHEME_STORAGE_KEY, preference);
  const isDark = resolveAdminColorSchemeDark(preference);
  document.documentElement.classList.toggle("dark", isDark);
};

export const useAdminColorScheme = () => {
  const preference = useStorage<AdminColorSchemePreference>(
    ADMIN_COLOR_SCHEME_STORAGE_KEY,
    "light",
    undefined,
    { serializer: { read: parseStoredPreference, write: (value) => value } },
  );
  const mode = useColorMode({
    selector: "html",
    attribute: "class",
    modes: { dark: "dark", light: "" },
    storageRef: preference,
  });
  return computed({
    get: () => mode.value === "dark",
    set: (dark: boolean) => {
      mode.value = dark ? "dark" : "light";
    },
  });
};
