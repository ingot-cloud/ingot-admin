import { EXPLICIT_LOGOUT_STORAGE_KEY, RETURN_TO_STORAGE_KEY } from "./types";

const FORBIDDEN = /\\|\/\//;
const EXPLICIT_LOGOUT_MARK = "1";

export const sanitizeReturnTo = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || FORBIDDEN.test(trimmed)) {
    return null;
  }
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed)) {
    return null;
  }
  return trimmed;
};

export const saveReturnTo = (path: string, storage: Storage = sessionStorage): void => {
  const sanitized = sanitizeReturnTo(path);
  if (sanitized) {
    storage.setItem(RETURN_TO_STORAGE_KEY, sanitized);
  }
};

export const takeReturnTo = (storage: Storage = sessionStorage): string | null => {
  const raw = storage.getItem(RETURN_TO_STORAGE_KEY);
  storage.removeItem(RETURN_TO_STORAGE_KEY);
  return sanitizeReturnTo(raw);
};

export const markExplicitLogout = (storage: Storage = sessionStorage): void => {
  storage.setItem(EXPLICIT_LOGOUT_STORAGE_KEY, EXPLICIT_LOGOUT_MARK);
  storage.removeItem(RETURN_TO_STORAGE_KEY);
};

export const consumeExplicitLogout = (storage: Storage = sessionStorage): boolean => {
  const marked = storage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY) === EXPLICIT_LOGOUT_MARK;
  storage.removeItem(EXPLICIT_LOGOUT_STORAGE_KEY);
  return marked;
};
