import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bindCsrfToTransaction,
  clearCsrfToken,
  csrfMatchesTransaction,
  currentCsrfToken,
  currentCsrfTransactionId,
  rememberCsrfToken,
} from "./csrf";

const sessionStore = new Map<string, string>();

vi.stubGlobal("sessionStorage", {
  getItem: (key: string) => sessionStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    sessionStore.set(key, value);
  },
  removeItem: (key: string) => {
    sessionStore.delete(key);
  },
});

afterEach(() => {
  sessionStore.clear();
  clearCsrfToken();
});

describe("csrf transaction binding", () => {
  it("does not treat a cached token as matching until bound to a transaction", () => {
    rememberCsrfToken("csrf-1");
    expect(currentCsrfToken()).toBe("csrf-1");
    expect(csrfMatchesTransaction("tx-1")).toBe(false);
  });

  it("matches only the bound transaction", () => {
    rememberCsrfToken("csrf-1");
    bindCsrfToTransaction("tx-1");
    expect(currentCsrfTransactionId()).toBe("tx-1");
    expect(csrfMatchesTransaction("tx-1")).toBe(true);
    expect(csrfMatchesTransaction("tx-2")).toBe(false);
  });

  it("clears the transaction binding when a new token is remembered", () => {
    rememberCsrfToken("csrf-1");
    bindCsrfToTransaction("tx-1");
    rememberCsrfToken("csrf-2");
    expect(currentCsrfTransactionId()).toBeUndefined();
    expect(csrfMatchesTransaction("tx-1")).toBe(false);
  });
});
