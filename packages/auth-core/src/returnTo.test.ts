import { describe, expect, it } from "vitest";
import {
  consumeExplicitLogout,
  saveReturnTo,
  markExplicitLogout,
  sanitizeReturnTo,
  takeReturnTo,
} from "./returnTo";
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

// 避免站内登录返回路径自循环以及编码后的伪相对路径。
describe("normalized return path", () => {
  it("拒绝登录自循环、控制字符与编码斜线", () => {
    for (const path of [
      "/login/",
      "/auth/start?tx=old",
      "/a/../login/",
      "/%2F%2Fevil.example",
      "/%5cevil.example",
      "/%0alogin",
    ])
      expect(sanitizeReturnTo(path)).toBeNull();
    expect(sanitizeReturnTo("/a/../settings?tab=security#password")).toBe(
      "/settings?tab=security#password",
    );
  });
});

it("实际应用使用各自命名空间，另一应用不能消费返回路径或退出意图", () => {
  const storage = memoryStorage();
  saveReturnTo("/platform/settings", storage, "platform-admin");
  saveReturnTo("/org/members", storage, "tenant-admin");
  markExplicitLogout(storage, "platform-admin");
  expect(consumeExplicitLogout(storage, "tenant-admin")).toBe(false);
  expect(consumeExplicitLogout(storage, "platform-admin")).toBe(true);
  expect(takeReturnTo(storage, "tenant-admin")).toBe("/org/members");
  expect(takeReturnTo(storage, "platform-admin")).toBeNull();
});
