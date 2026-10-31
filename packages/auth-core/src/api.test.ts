import { afterEach, describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@ingot/http-client";
import { createAuthApi } from "./api";
import { clearCsrfToken } from "./csrf";
afterEach(clearCsrfToken);
const transport = () => ({
  post: vi.fn(async (url: string) => ({
    data: url.endsWith("/csrf")
      ? { csrfToken: "csrf", expiresAt: "2099-01-01T00:00:00Z" }
      : { transactionId: "opaque-transaction", stage: "LOGIN" },
  })),
  get: vi.fn(async () => ({ data: {} })),
  delete: vi.fn(async () => ({ data: undefined })),
});
describe("same-origin BFF API", () => {
  it("实例化不请求；点击自举后创建事务，密码整包HYBRID并保持静默", async () => {
    const http = transport();
    const api = createAuthApi(http as unknown as HttpClient, "platform");
    expect(http.post).not.toHaveBeenCalled();
    await api.createTransaction();
    await api.login("owner", "memory-only", "opaque");
    expect(http.post.mock.calls.map((call) => call[0])).toEqual([
      "/api/bff/auth/csrf",
      "/api/bff/auth/platform/transactions",
      "/api/bff/auth/platform/login",
    ]);
    expect(http.post).toHaveBeenLastCalledWith(
      "/api/bff/auth/platform/login",
      { username: "owner", password: "memory-only", transactionId: "opaque" },
      expect.objectContaining({
        feedback: "silent",
        crypto: { request: { mode: "whole" } },
        headers: { "X-CSRF-Token": "csrf" },
      }),
    );
  });
  it("只读/恢复接口没有ticket，退出总清本应用内存凭证", async () => {
    const http = transport();
    const api = createAuthApi(http as unknown as HttpClient, "tenant");
    await api.issueCsrf();
    await api.readTransaction("opaque");
    await api.resume("opaque");
    await api.logout();
    expect(http.get).toHaveBeenCalledWith("/api/bff/auth/tenant/transactions/opaque", null, {
      feedback: "silent",
    });
    expect(http.post).toHaveBeenCalledWith(
      "/api/bff/auth/tenant/transactions/opaque/resume",
      {},
      expect.any(Object),
    );
    expect(http.delete).toHaveBeenCalledWith(
      "/api/bff/auth/logout",
      null,
      expect.objectContaining({ feedback: "silent" }),
    );
  });
  it("退出中止信号覆盖CSRF与DELETE，准备已中止时不再发退出请求", async () => {
    const http = transport();
    const api = createAuthApi(http as unknown as HttpClient, "tenant");
    const controller = new AbortController();
    await api.logout(controller.signal);
    expect(http.post).toHaveBeenCalledWith(
      "/api/bff/auth/csrf",
      {},
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(http.delete).toHaveBeenCalledWith(
      "/api/bff/auth/logout",
      null,
      expect.objectContaining({ signal: controller.signal }),
    );
    const aborted = new AbortController();
    aborted.abort();
    http.post.mockRejectedValueOnce(new Error("aborted"));
    http.delete.mockClear();
    await expect(api.logout(aborted.signal)).rejects.toThrow("aborted");
    expect(http.delete).not.toHaveBeenCalled();
  });
});
