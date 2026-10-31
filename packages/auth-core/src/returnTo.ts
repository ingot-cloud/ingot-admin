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
  try {
    const target = new URL(trimmed, "https://same-origin.invalid");
    if (target.origin !== "https://same-origin.invalid") return null;
    let path = target.pathname;
    for (let n = 0; n < 3; n += 1) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    }
    if (/[\\\u0000-\u0020\u007f]/u.test(path) || path.startsWith("//")) return null;
    const normalized = new URL(path, target.origin).pathname.replace(/\/$/, "");
    if (["/login", "/auth/start", "/auth/complete", "/oauth2/challenge"].includes(normalized))
      return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
};

const resolveStorage = (storage?: Storage): Storage | undefined => {
  try {
    return storage ?? globalThis.sessionStorage;
  } catch {
    return undefined;
  }
};
const scopedKey = (base: string, appId?: string): string =>
  appId ? base.replace("ingot.auth.", `ingot.auth.${appId}.`) : base;
export const saveReturnTo = (path: string, storage?: Storage, appId?: string): void => {
  const sanitized = sanitizeReturnTo(path);
  try {
    if (sanitized)
      resolveStorage(storage)?.setItem(scopedKey(RETURN_TO_STORAGE_KEY, appId), sanitized);
  } catch {
    /* storage may be disabled */
  }
};
export const takeReturnTo = (storage?: Storage, appId?: string): string | null => {
  try {
    const target = resolveStorage(storage);
    const raw = target?.getItem(scopedKey(RETURN_TO_STORAGE_KEY, appId));
    target?.removeItem(scopedKey(RETURN_TO_STORAGE_KEY, appId));
    return sanitizeReturnTo(raw);
  } catch {
    return null;
  }
};
export const markExplicitLogout = (storage?: Storage, appId?: string): void => {
  try {
    const target = resolveStorage(storage);
    target?.setItem(scopedKey(EXPLICIT_LOGOUT_STORAGE_KEY, appId), EXPLICIT_LOGOUT_MARK);
    target?.removeItem(scopedKey(RETURN_TO_STORAGE_KEY, appId));
  } catch {
    /* fixed query intent is the fallback */
  }
};
export const consumeExplicitLogout = (storage?: Storage, appId?: string): boolean => {
  try {
    const target = resolveStorage(storage);
    const marked =
      target?.getItem(scopedKey(EXPLICIT_LOGOUT_STORAGE_KEY, appId)) === EXPLICIT_LOGOUT_MARK;
    target?.removeItem(scopedKey(EXPLICIT_LOGOUT_STORAGE_KEY, appId));
    return marked;
  } catch {
    return false;
  }
};
