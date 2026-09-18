import { clearCsrfToken } from "./csrf";

export const BFF_TRANSACTION_EXPIRED = "BFF_TRANSACTION_EXPIRED";

export const BFF_BINDING_MISMATCH = "BFF_BINDING_MISMATCH";

export const TRANSACTION_EXPIRED_RESTART_DELAY_MS = 1200;

let restartScheduled = false;

const errorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }
  return (error as { code?: string }).code;
};

export const isBffTransactionExpired = (error: unknown): boolean =>
  errorCode(error) === BFF_TRANSACTION_EXPIRED;

export const isBffBindingMismatch = (error: unknown): boolean => errorCode(error) === BFF_BINDING_MISMATCH;

export const shouldRestartLoginAtAdminStart = (error: unknown): boolean =>
  isBffTransactionExpired(error) || isBffBindingMismatch(error);

export const resetLoginRestartSchedule = (): void => {
  restartScheduled = false;
};

export const restartLoginAtAdminStart = (
  startUrl: string | undefined,
  options?: { delayMs?: number; onBeforeRedirect?: () => void },
): boolean => {
  if (!startUrl) {
    return false;
  }
  if (restartScheduled) {
    return true;
  }
  restartScheduled = true;
  clearCsrfToken();
  options?.onBeforeRedirect?.();
  const delayMs = options?.delayMs ?? TRANSACTION_EXPIRED_RESTART_DELAY_MS;
  if (delayMs <= 0) {
    globalThis.location.replace(startUrl);
    return true;
  }
  globalThis.setTimeout(() => {
    globalThis.location.replace(startUrl);
  }, delayMs);
  return true;
};
