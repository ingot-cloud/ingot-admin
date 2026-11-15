import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { createHttpClient, defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import HeaderInterceptor from "./interceptor/request/header";
import IdentityRequestInterceptor, { captureRequestIdentity } from "./interceptor/request/identity";
import IdentityResponseInterceptor from "./interceptor/response/identity";
import {
  rememberSessionContext,
  BFF_CONTEXT_HEADER,
  publishOrganizationSync,
} from "@ingot/auth-core";

const state = vi.hoisted(() => ({
  epoch: 0,
  fingerprintEnabled: false,
  fingerprint: vi.fn(),
  entry: "platform",
}));
vi.mock("@/stores/modules/auth", () => ({
  usePermissions: () => ({ contextEpoch: state.epoch }),
  useAuthStore: () => ({ switchingIdentity: false, loggingOut: false }),
}));
vi.mock("@/stores/modules/app", () => ({
  useAppStore: () => ({ app: { login: { fingerprintEnabled: state.fingerprintEnabled } } }),
}));
vi.mock("@ingot/shared", () => ({ generateFingerprint: () => state.fingerprint() }));
vi.mock("@/runtime", () => ({ getAdminRuntimeConfig: () => ({ login: { entry: state.entry } }) }));

describe("身份请求隔离", () => {
  beforeEach(() => {
    state.epoch = 0;
    state.entry = "platform";
    state.fingerprintEnabled = false;
    state.fingerprint.mockReset();
    rememberSessionContext({
      appId: "tenant-admin",
      domain: "TENANT",
      userId: 1,
      clientId: "client",
      tenantId: "42",
      contextVersion: "source",
    });
  });

  it("异步拦截器开始前切换身份，也不能以新组织发送旧载荷", async () => {
    state.entry = "tenant";
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
      config,
      headers: {},
      status: 200,
      statusText: "OK",
      data: { code: "S0200", data: {} },
    }));
    const client = createHttpClient({
      adapter,
      hooks: { onRequestCreated: captureRequestIdentity },
      interceptors: {
        request: [HeaderInterceptor, IdentityRequestInterceptor],
        response: [IdentityResponseInterceptor],
      },
    });
    const pending = client.post("/api/iam/groups", { name: "source-payload" });
    queueMicrotask(() => {
      state.epoch += 1;
      rememberSessionContext({
        appId: "tenant-admin",
        domain: "TENANT",
        userId: 1,
        clientId: "client",
        tenantId: "43",
        contextVersion: "target",
      });
    });
    await expect(pending).rejects.toMatchObject({ cancelled: true });
    expect(adapter).not.toHaveBeenCalled();
  });

  it("租户请求固定原版本，重试不能自动改绑新 Cookie 的组织", async () => {
    state.entry = "tenant";
    const me = {
      appId: "tenant-admin",
      domain: "TENANT" as const,
      userId: 1,
      clientId: "client",
      tenantId: "42",
      contextVersion: "source",
    };
    rememberSessionContext(me);
    const config = { url: "/api/iam/mutation", headers: new AxiosHeaders() };
    await HeaderInterceptor.resolved!(config);
    rememberSessionContext({ ...me, tenantId: "43", contextVersion: "target" });
    await HeaderInterceptor.resolved!(config);
    expect(config.headers[BFF_CONTEXT_HEADER]).toBe("source");
  });

  it("同源切换正在提交时暂停业务请求，但允许认证恢复", async () => {
    state.entry = "tenant";
    publishOrganizationSync({
      phase: "pending",
      transactionId: "pending-transaction",
      sourceVersion: "source",
      expiresAt: "2099-01-01T00:00:00Z",
    });
    await expect(
      HeaderInterceptor.resolved!({ url: "/api/iam/mutation", headers: new AxiosHeaders() }),
    ).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await expect(
      HeaderInterceptor.resolved!({ url: "/api/bff/auth/me", headers: new AxiosHeaders() }),
    ).resolves.toBeDefined();
    publishOrganizationSync({
      phase: "cancelled",
      transactionId: "pending-transaction",
      sourceVersion: "source",
      expiresAt: "2099-01-01T00:00:00Z",
    });
  });

  it("新组织已确认后，来源旧版本的迟到暂停记录不能阻塞业务", async () => {
    state.entry = "tenant";
    rememberSessionContext({
      appId: "tenant-admin",
      domain: "TENANT",
      userId: 1,
      clientId: "client",
      tenantId: "43",
      contextVersion: "target",
    });
    publishOrganizationSync({
      phase: "pending",
      transactionId: "losing-transaction",
      sourceVersion: "source",
      expiresAt: "2099-01-01T00:00:00Z",
    });
    const config = { url: "/api/iam/bootstrap", headers: new AxiosHeaders() };
    await HeaderInterceptor.resolved!(config);
    expect(config.headers[BFF_CONTEXT_HEADER]).toBe("target");
  });

  it.each(["success", "http401", "business401"] as const)(
    "忽略旧身份的 %s 响应，不提示或退出新身份",
    async (kind) => {
      let respond!: () => void;
      const unauthorized = vi.fn();
      const feedback = vi.fn();
      const client = createHttpClient({
        adapter: (config) =>
          new Promise((resolve, reject) => {
            respond = () => {
              const response: AxiosResponse = {
                config,
                headers: {},
                statusText: "fixture",
                status: kind === "http401" ? 401 : 200,
                data: { code: kind === "success" ? "S0200" : "S0401", data: { accountId: "old" } },
              };
              if (kind === "http401")
                reject(
                  new AxiosError("unauthorized", "ERR_BAD_REQUEST", config, undefined, response),
                );
              else resolve(response);
            };
          }),
        interceptors: {
          request: [HeaderInterceptor, IdentityRequestInterceptor],
          response: [IdentityResponseInterceptor],
        },
        hooks: {
          isUnauthorized: (error) => error.status === 401 || error.code === "S0401",
          onUnauthorized: unauthorized,
          onHttpError: feedback,
          onBusinessFailure: feedback,
        },
      });
      const pending = client.get("/old-identity");
      await vi.waitFor(() => expect(respond).toBeDefined());
      state.epoch += 1;
      respond();
      await expect(pending).rejects.toMatchObject({ cancelled: true });
      expect(unauthorized).not.toHaveBeenCalled();
      expect(feedback).not.toHaveBeenCalled();
    },
  );

  it("当前身份的未授权响应仍正常处理", async () => {
    const unauthorized = vi.fn();
    const client = createHttpClient({
      adapter: async (config) => ({
        config,
        headers: {},
        status: 200,
        statusText: "OK",
        data: { code: "S0401" },
      }),
      interceptors: {
        request: [HeaderInterceptor, IdentityRequestInterceptor],
        response: [IdentityResponseInterceptor],
      },
      hooks: { isUnauthorized: (error) => error.code === "S0401", onUnauthorized: unauthorized },
    });
    await expect(client.get("/current-identity")).rejects.toMatchObject({ code: "S0401" });
    expect(unauthorized).toHaveBeenCalledOnce();
  });

  it("异步准备期间切换身份时，旧写请求不进入网络", async () => {
    let prepared!: () => void;
    const adapter = vi.fn();
    const prepare = defineRequestInterceptor({
      name: "fixture-preparation",
      order: InterceptorOrder.request.envelope,
      resolved: (config) =>
        new Promise((resolve) => {
          prepared = () => resolve(config);
        }),
    });
    const client = createHttpClient({
      adapter,
      interceptors: {
        request: [HeaderInterceptor, prepare, IdentityRequestInterceptor],
        response: [IdentityResponseInterceptor],
      },
    });
    const pending = client.post("/old-write", {});
    await vi.waitFor(() => expect(prepared).toBeDefined());
    state.epoch += 1;
    prepared();
    await expect(pending).rejects.toMatchObject({ cancelled: true });
    expect(adapter).not.toHaveBeenCalled();
  });

  it("指纹准备和挑战重试保留原身份纪元，切换后不发送", async () => {
    state.fingerprintEnabled = true;
    let fingerprint!: (value: string) => void;
    state.fingerprint.mockImplementation(
      () =>
        new Promise((resolve) => {
          fingerprint = resolve;
        }),
    );
    const config = { headers: new AxiosHeaders() };
    const pending = HeaderInterceptor.resolved!(config);
    state.epoch += 1;
    fingerprint("fixture");
    await expect(pending).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await expect(HeaderInterceptor.resolved!(config)).rejects.toMatchObject({
      code: "ERR_CANCELED",
    });
    expect(state.fingerprint).toHaveBeenCalledOnce();
  });
});
