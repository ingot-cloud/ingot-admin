import type { User } from "@/models/security";

export const UI_PREFERENCE_BROWSER_SCOPE = "browser";
export const COLUMN_SETTING_STORAGE_PREFIX = "in-column-setting";
export const FILTER_LEFT_STORAGE_PREFIX = "in-filter-left-open";

export const resolveUiUserKey = (user?: User): string => {
  return user?.phone || user?.nickname || user?.email || UI_PREFERENCE_BROWSER_SCOPE;
};

export const buildUiPreferenceKey = (...parts: Array<string | undefined>): string => {
  return parts.filter((part): part is string => Boolean(part)).join(":");
};

export const readUiPreference = <T>(storageKey: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeUiPreference = (storageKey: string, value: unknown): void => {
  localStorage.setItem(storageKey, JSON.stringify(value));
};
