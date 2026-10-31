import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import {
  clearCsrfToken,
  currentCsrfToken,
  rememberCsrfToken,
  isSameOriginAuthRequest,
  createCsrfRequestInterceptor,
} from "./csrf";
afterEach(() => {
  clearCsrfToken();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("application memory-only csrf", () => {
  it("按应用缓存并按ISO期限失效", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T00:00:00Z"));
    rememberCsrfToken("p", "platform", "2026-10-31T00:00:01Z");
    rememberCsrfToken("t", "tenant");
    expect(currentCsrfToken("platform")).toBe("p");
    vi.advanceTimersByTime(1001);
    expect(currentCsrfToken("platform")).toBeUndefined();
    expect(currentCsrfToken("tenant")).toBe("t");
  });
  it("禁止其他origin/普通API以及GET附加CSRF", async () => {
    vi.stubGlobal("location", { origin: "https://127.0.0.1:8443" });
    rememberCsrfToken("p", "platform");
    expect(isSameOriginAuthRequest("https://127.0.0.1:9443/api/bff/auth/logout")).toBe(false);
    const interceptor = createCsrfRequestInterceptor(() => "platform");
    for (const [url, method, expected] of [
      ["/api/bff/auth/platform/login", "post", "p"],
      ["/api/bff/auth/csrf", "post", undefined],
      ["/api/bff/auth/me", "get", undefined],
      ["/api/iam/write", "post", undefined],
      ["https://evil.example/api/bff/auth/logout", "delete", undefined],
    ] as const) {
      const config = { url, method, headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
      const result = await interceptor.resolved?.(config);
      expect(result?.headers["X-CSRF-Token"]).toBe(expected);
    }
  });
});
