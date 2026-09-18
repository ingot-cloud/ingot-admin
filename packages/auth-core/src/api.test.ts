import { afterEach, describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@ingot/http-client";
import { createAuthApi } from "./api";
import { clearCsrfToken, rememberCsrfToken, bindCsrfToTransaction } from "./csrf";

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

const mockHttp = (csrfToken = "csrf-new") => {
  const post = vi.fn(async (url: string) => {
    if (url.includes("/csrf")) {
      return { data: { csrfToken } };
    }
    return { data: { transactionId: "tx-1", loginUrl: "http://localhost:1798/oauth2/challenge?tx=tx-1" } };
  });
  const del = vi.fn(async () => ({ data: undefined }));
  return { post, delete: del } as unknown as HttpClient & {
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

describe("createAuthApi.createTransaction", () => {
  it("reissues csrf even when a token is already cached", async () => {
    rememberCsrfToken("csrf-stale");
    const http = mockHttp("csrf-fresh");
    const api = createAuthApi(http, "tenant");

    await api.createTransaction();

    expect(http.post).toHaveBeenCalledTimes(2);
    expect(http.post.mock.calls[0]?.[0]).toBe("/api/bff/auth/csrf");
    expect(http.post.mock.calls[1]?.[0]).toBe("/api/bff/auth/tenant/transactions");
  });
});

describe("createAuthApi.ensureCsrfForTransaction", () => {
  it("reissues csrf when the cached token belongs to another transaction", async () => {
    rememberCsrfToken("csrf-stale");
    bindCsrfToTransaction("tx-old");
    const http = mockHttp("csrf-fresh");
    const api = createAuthApi(http, "tenant");

    await api.ensureCsrfForTransaction("tx-new");

    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.post.mock.calls[0]?.[0]).toBe("/api/bff/auth/csrf");
  });

  it("reuses csrf for the same transaction", async () => {
    rememberCsrfToken("csrf-same");
    bindCsrfToTransaction("tx-1");
    const http = mockHttp("csrf-fresh");
    const api = createAuthApi(http, "tenant");

    await api.ensureCsrfForTransaction("tx-1");
    await api.login("owner", "password", "tx-1");

    expect(http.post.mock.calls.filter((call) => call[0] === "/api/bff/auth/csrf")).toHaveLength(0);
    expect(http.post.mock.calls[0]?.[0]).toBe("/api/bff/auth/tenant/login");
  });
});

describe("createAuthApi.logout", () => {
  it("reissues csrf even when a token is already cached", async () => {
    rememberCsrfToken("csrf-stale");
    const http = mockHttp("csrf-fresh");
    const api = createAuthApi(http, "tenant");

    await api.logout();

    expect(http.post.mock.calls[0]?.[0]).toBe("/api/bff/auth/csrf");
    expect(http.delete).toHaveBeenCalledWith("/api/bff/auth/logout");
  });
});
