import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currentCsrfToken, rememberCsrfToken, clearCsrfToken } from "./csrf";
import {
  isBffBindingMismatch,
  isBffTransactionExpired,
  resetLoginRestartSchedule,
  restartLoginAtAdminStart,
  shouldRestartLoginAtAdminStart,
  TRANSACTION_EXPIRED_RESTART_DELAY_MS,
} from "./errors";

describe("isBffTransactionExpired", () => {
  it("matches the BFF expired code", () => {
    expect(isBffTransactionExpired({ code: "BFF_TRANSACTION_EXPIRED" })).toBe(true);
    expect(isBffTransactionExpired({ code: "BFF_BINDING_MISMATCH" })).toBe(false);
    expect(isBffTransactionExpired(undefined)).toBe(false);
  });
});

describe("shouldRestartLoginAtAdminStart", () => {
  it("restarts on expired or binding mismatch", () => {
    expect(shouldRestartLoginAtAdminStart({ code: "BFF_TRANSACTION_EXPIRED" })).toBe(true);
    expect(shouldRestartLoginAtAdminStart({ code: "BFF_BINDING_MISMATCH" })).toBe(true);
    expect(isBffBindingMismatch({ code: "BFF_BINDING_MISMATCH" })).toBe(true);
    expect(shouldRestartLoginAtAdminStart({ code: "BFF_ENTRY_MISMATCH" })).toBe(false);
  });
});

describe("restartLoginAtAdminStart", () => {
  const sessionStore = new Map<string, string>();

  beforeEach(() => {
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sessionStore.set(key, value);
      },
      removeItem: (key: string) => {
        sessionStore.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    sessionStore.clear();
    clearCsrfToken();
    resetLoginRestartSchedule();
  });

  it("notifies then replaces after the default delay", () => {
    vi.useFakeTimers();
    const replace = vi.fn();
    const onBeforeRedirect = vi.fn();
    vi.stubGlobal("location", { replace });

    expect(
      restartLoginAtAdminStart("http://localhost:5798/auth/start", { onBeforeRedirect }),
    ).toBe(true);
    expect(onBeforeRedirect).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();

    vi.advanceTimersByTime(TRANSACTION_EXPIRED_RESTART_DELAY_MS);
    expect(replace).toHaveBeenCalledWith("http://localhost:5798/auth/start");
  });

  it("clears the cached csrf token before redirecting", () => {
    rememberCsrfToken("csrf-stale");
    vi.stubGlobal("location", { replace: vi.fn() });

    restartLoginAtAdminStart("http://localhost:5798/auth/start", { delayMs: 0 });

    expect(currentCsrfToken()).toBeUndefined();
  });

  it("does not notify or replace twice", () => {
    vi.useFakeTimers();
    const replace = vi.fn();
    const onBeforeRedirect = vi.fn();
    vi.stubGlobal("location", { replace });

    expect(restartLoginAtAdminStart("http://localhost:5798/auth/start", { onBeforeRedirect })).toBe(
      true,
    );
    expect(restartLoginAtAdminStart("http://localhost:5798/auth/start", { onBeforeRedirect })).toBe(
      true,
    );
    expect(onBeforeRedirect).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(TRANSACTION_EXPIRED_RESTART_DELAY_MS);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the start url is missing", () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace });
    expect(restartLoginAtAdminStart(undefined)).toBe(false);
    expect(restartLoginAtAdminStart("")).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
