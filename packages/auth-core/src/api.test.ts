import { afterEach, describe, expect, it, vi } from "vitest";
import type { HttpClient } from "@ingot/http-client";
import { createAuthApi } from "./api";
import { clearCsrfToken } from "./csrf";
import {
  clearSessionContext,
  currentSessionContext,
  rememberSessionContext,
  BFF_CONTEXT_HEADER,
} from "./context";
import {
  readLogoutState,
  confirmPendingLogout,
  hasPendingLogout,
  LogoutPendingError,
} from "./logoutState";
afterEach(() => {
  for (const app of ["tenant-admin", "platform-admin"]) {
    const state = readLogoutState(app);
    if (state?.phase === "pending") confirmPendingLogout(app, state.operationId);
  }
  clearCsrfToken();
  clearSessionContext();
});
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
  it("me只返回实际身份，宿主接纳前不覆盖旧界面的组织版本", async () => {
    const source = {
      appId: "tenant-admin",
      domain: "TENANT" as const,
      userId: 1,
      clientId: "client",
      contextVersion: "source",
    };
    rememberSessionContext(source);
    const http = transport();
    http.get.mockResolvedValueOnce({ data: { ...source, contextVersion: "target" } });
    const result = await createAuthApi(http as unknown as HttpClient, "tenant").me();
    expect(result.data.contextVersion).toBe("target");
    expect(currentSessionContext()).toBe("source");
  });
  it("注销在CSRF准备之前固定来源，失败后保留意图并阻止自动me和新登录", async () => {
    const source = {
      appId: "tenant-admin",
      domain: "TENANT" as const,
      userId: 1,
      clientId: "client",
      tenantId: "42",
      contextVersion: "original",
    };
    rememberSessionContext(source);
    const http = transport();
    http.post.mockImplementation(async () => {
      rememberSessionContext({ ...source, contextVersion: "another-context" });
      return { data: { csrfToken: "csrf", expiresAt: "2099-01-01T00:00:00Z" } };
    });
    http.delete.mockRejectedValueOnce(new Error("reply lost"));
    const api = createAuthApi(http as unknown as HttpClient, "tenant");
    await expect(api.logout()).rejects.toThrow("reply lost");
    expect(hasPendingLogout("tenant-admin")).toBe(true);
    await expect(api.me()).rejects.toBeInstanceOf(LogoutPendingError);
    await expect(api.createTransaction()).rejects.toBeInstanceOf(LogoutPendingError);
    expect(http.get).not.toHaveBeenCalled();
    await createAuthApi(http as unknown as HttpClient, "tenant").logout();
    for (const call of http.delete.mock.calls)
      expect(call[2]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({ [BFF_CONTEXT_HEADER]: "original" }),
        }),
      );
    expect(hasPendingLogout("tenant-admin")).toBe(false);
  });
  it.each(["query", "create", "commit"] as const)(
    "%s 在 CSRF 准备期间也固定来源版本，不改绑新 Cookie",
    async (kind) => {
      const source = {
        appId: "tenant-admin",
        domain: "TENANT" as const,
        userId: 1,
        clientId: "client",
        tenantId: "42",
        contextVersion: "source",
      };
      rememberSessionContext(source);
      const http = transport();
      http.post.mockImplementation(async (url) => {
        if (url.endsWith("/csrf"))
          rememberSessionContext({ ...source, tenantId: "43", contextVersion: "target" });
        return {
          data: url.endsWith("/csrf")
            ? { csrfToken: "csrf", expiresAt: "2099-01-01T00:00:00Z" }
            : { transactionId: "opaque-transaction", stage: "LOGIN" },
        };
      });
      const api = createAuthApi(http as unknown as HttpClient, "tenant");
      if (kind === "query") await api.queryOrganizations({ page: 1, pageSize: 20 });
      else if (kind === "create") await api.createOrganizationSwitch("44");
      else await api.commitOrganizationSwitch("original-transaction");
      expect(http.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({ [BFF_CONTEXT_HEADER]: "source" }),
        }),
      );
    },
  );
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
