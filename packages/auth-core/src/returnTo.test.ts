import { describe, expect, it } from "vitest";
import { consumeExplicitLogout, markExplicitLogout, sanitizeReturnTo, takeReturnTo } from "./returnTo";
import { EXPLICIT_LOGOUT_STORAGE_KEY, RETURN_TO_STORAGE_KEY } from "./types";

const memoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
};

describe("sanitizeReturnTo", () => {
  it("keeps a relative path", () => {
    expect(sanitizeReturnTo("/org/members?q=1#top")).toBe("/org/members?q=1#top");
  });

  it("rejects absolute urls and protocol-relative paths", () => {
    expect(sanitizeReturnTo("https://evil.example/")).toBeNull();
    expect(sanitizeReturnTo("//evil.example")).toBeNull();
    expect(sanitizeReturnTo("/\\evil")).toBeNull();
  });
});

describe("markExplicitLogout", () => {
  it("clears returnTo and is consumed once", () => {
    const storage = memoryStorage();
    storage.setItem(RETURN_TO_STORAGE_KEY, "/org/iam/members");
    markExplicitLogout(storage);

    expect(storage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY)).toBe("1");
    expect(takeReturnTo(storage)).toBeNull();
    expect(consumeExplicitLogout(storage)).toBe(true);
    expect(consumeExplicitLogout(storage)).toBe(false);
  });
});
