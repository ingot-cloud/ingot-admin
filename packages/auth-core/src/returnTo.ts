const FORBIDDEN = /\\|\/\//;

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
    storage.setItem("ingot.auth.returnTo", sanitized);
  }
};

export const takeReturnTo = (storage: Storage = sessionStorage): string | null => {
  const raw = storage.getItem("ingot.auth.returnTo");
  storage.removeItem("ingot.auth.returnTo");
  return sanitizeReturnTo(raw);
};
