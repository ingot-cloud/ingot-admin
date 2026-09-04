import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient, type PostFilter, type PreFilter, type R } from "@ingot/http-client";
import { CryptoErrorCode } from "@ingot/shared/crypto";

const createEnvelopeSession = vi.fn();
const applyEncryptedRequest = vi.fn();
const decryptResponseBody = vi.fn();
const refresh = vi.fn();
const maybeRefreshKeyOnKidMismatch = vi.fn();
const isEnvelopeResponse = vi.fn();

vi.mock("@ingot/shared/crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/shared/crypto")>();
  return {
    ...actual,
    createEnvelopeSession: (...args: unknown[]) => createEnvelopeSession(...args),
    applyEncryptedRequest: (...args: unknown[]) => applyEncryptedRequest(...args),
    decryptResponseBody: (...args: unknown[]) => decryptResponseBody(...args),
  };
});

vi.mock("@/net/crypto", () => ({
  keyStore: { refresh: (...args: unknown[]) => refresh(...args) },
  cryptoHeaderNames: { md: "Md", kv: "Kv", sk: "Sk", no: "No", ts: "Ts" },
  rawInstance: {
    request: vi.fn(),
  },
  maybeRefreshKeyOnKidMismatch: (...args: unknown[]) => maybeRefreshKeyOnKidMismatch(...args),
  isEnvelopeResponse: (...args: unknown[]) => isEnvelopeResponse(...args),
}));

const { default: EnvelopeRequestInterceptor } = await import("./interceptor/request/envelope");
const { default: EnvelopeResponseInterceptor } = await import("./interceptor/response/envelope");
const { rawInstance } = await import("./crypto");

const jsonAdapter = (
  handler: (config: InternalAxiosRequestConfig) => { status?: number; data: unknown },
): AxiosAdapter => {
  return async (config) => {
    const result = handler(config as InternalAxiosRequestConfig);
    return {
      data: result.data,
      status: result.status ?? 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    };
  };
};

describe("信封拦截器", () => {
  beforeEach(() => {
    createEnvelopeSession.mockReset();
    applyEncryptedRequest.mockReset();
    decryptResponseBody.mockReset();
    refresh.mockReset();
    maybeRefreshKeyOnKidMismatch.mockReset();
    isEnvelopeResponse.mockReset();
    vi.mocked(rawInstance.request).mockReset();
    createEnvelopeSession.mockResolvedValue({
      context: { kid: "k1" },
      headers: { Md: "h1", Kv: "k1" },
    });
    applyEncryptedRequest.mockImplementation(async (source: { data?: unknown; params?: unknown }) => ({
      data: { data: "cipher" },
      params: source.params,
      plainData: source.data,
      plainParams: source.params,
    }));
    decryptResponseBody.mockImplementation(async (body: unknown) => body);
    isEnvelopeResponse.mockReturnValue(true);
    refresh.mockResolvedValue(undefined);
  });

  it("whole 模式加密请求体并解密响应", async () => {
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        data: { code: "S0200", message: "ok", data: { secret: "cipher" } },
      })),
      interceptors: {
        request: [EnvelopeRequestInterceptor as PreFilter],
        response: [EnvelopeResponseInterceptor as PostFilter],
      },
    });

    decryptResponseBody.mockResolvedValue({ code: "S0200", message: "ok", data: { secret: "plain" } });

    const result = await http.post(
      "/api/secure",
      { name: "app" },
      { crypto: { request: { mode: "whole" }, response: { mode: "full" } } },
    );

    expect(createEnvelopeSession).toHaveBeenCalled();
    expect(applyEncryptedRequest).toHaveBeenCalled();
    expect(decryptResponseBody).toHaveBeenCalled();
    expect(result.data).toEqual({ secret: "plain" });
  });

  it("query 模式加密 params", async () => {
    let seenParams: unknown;
    const http = createHttpClient({
      adapter: jsonAdapter((config) => {
        seenParams = config.params;
        return { data: { code: "S0200", message: "ok", data: {} } };
      }),
      interceptors: {
        request: [EnvelopeRequestInterceptor as PreFilter],
        response: [EnvelopeResponseInterceptor as PostFilter],
      },
    });
    applyEncryptedRequest.mockResolvedValue({
      params: { data: "cipher-query" },
      plainParams: { q: "1" },
    });
    await http.get("/api/secure", { q: "1" }, { crypto: { request: { mode: "query" } } });
    expect(seenParams).toEqual({ data: "cipher-query" });
  });

  it("field 模式加密请求字段", async () => {
    let seenData: unknown;
    const http = createHttpClient({
      adapter: jsonAdapter((config) => {
        seenData = config.data;
        return { data: { code: "S0200", message: "ok", data: {} } };
      }),
      interceptors: {
        request: [EnvelopeRequestInterceptor as PreFilter],
        response: [EnvelopeResponseInterceptor as PostFilter],
      },
    });
    applyEncryptedRequest.mockResolvedValue({
      data: { name: "cipher-field", age: 1 },
      plainData: { name: "alice", age: 1 },
    });
    await http.post(
      "/api/secure",
      { name: "alice", age: 1 },
      { crypto: { request: { mode: "field", fields: ["name"] } } },
    );
    expect(JSON.parse(String(seenData))).toEqual({ name: "cipher-field", age: 1 });
  });

  it("kid 失效时刷新公钥并重试一次", async () => {
    vi.mocked(rawInstance.request).mockResolvedValue({
      data: { code: "S0200", message: "ok", data: { ok: true } },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse<R>);
    decryptResponseBody.mockResolvedValue({ code: "S0200", message: "ok", data: { ok: true } });

    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        data: { code: CryptoErrorCode.KidUnknown, message: "kid unknown", data: {} },
      })),
      interceptors: {
        request: [EnvelopeRequestInterceptor as PreFilter],
        response: [EnvelopeResponseInterceptor as PostFilter],
      },
    });

    const result = await http.post(
      "/api/secure",
      { name: "app" },
      { crypto: { request: { mode: "whole" }, response: { mode: "full" } } },
    );
    expect(refresh).toHaveBeenCalled();
    expect(rawInstance.request).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({ ok: true });
  });
});
