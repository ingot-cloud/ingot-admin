import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { createHttpClient } from "./client";
import { ApiError } from "./error";
import { CancelManager } from "./cancel";
import { ProgressCounter } from "./progress";
import type { R } from "./types";

const jsonAdapter = (
  handler: (config: InternalAxiosRequestConfig) => {
    status?: number;
    data: unknown;
    delay?: number;
  },
): AxiosAdapter => {
  return async (config) => {
    const result = handler(config as InternalAxiosRequestConfig);
    if (config.signal?.aborted) {
      const error = new Error("canceled");
      error.name = "CanceledError";
      (error as Error & { code: string }).code = "ERR_CANCELED";
      throw error;
    }
    if (result.delay) {
      await new Promise((resolve) => {
        setTimeout(resolve, result.delay);
      });
    }
    if (config.signal?.aborted) {
      const error = new Error("canceled");
      error.name = "CanceledError";
      (error as Error & { code: string }).code = "ERR_CANCELED";
      throw error;
    }
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

const okBody = (data: unknown = { id: "1" }): R =>
  ({
    code: "S0200",
    message: "ok",
    data,
  }) as R;

describe("createHttpClient", () => {
  it("成功时归一化为 R 并展开 data", async () => {
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        data: { code: "S0200", message: "ok", data: { name: "app" } },
      })),
    });
    const result = await http.get<{ name: string }>("/api/app");
    expect(result.code).toBe("S0200");
    expect(result.data).toEqual({ name: "app" });
    expect(result.message).toBe("ok");
  });

  it("业务失败时抛出 ApiError 并触发 onBusinessFailure", async () => {
    const onBusinessFailure = vi.fn();
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        data: { code: "S0002", message: "非法操作", data: {} },
      })),
      hooks: { onBusinessFailure },
    });
    await expect(http.get("/api/app")).rejects.toMatchObject({
      kind: "business",
      code: "S0002",
      message: "非法操作",
    });
    expect(onBusinessFailure).toHaveBeenCalledTimes(1);
  });

  it("feedback silent 时业务失败不提示", async () => {
    const onBusinessFailure = vi.fn();
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        data: { code: "S0002", message: "非法操作", data: {} },
      })),
      hooks: { onBusinessFailure },
    });
    await expect(http.get("/api/app", null, { feedback: "silent" })).rejects.toBeInstanceOf(ApiError);
    expect(onBusinessFailure).not.toHaveBeenCalled();
  });

  it("未授权业务码走 onUnauthorized", async () => {
    const onUnauthorized = vi.fn();
    const onBusinessFailure = vi.fn();
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        data: { code: "S0401", message: "未登录", data: {} },
      })),
      hooks: {
        onUnauthorized,
        onBusinessFailure,
        isUnauthorized: (error) => error.code === "S0401",
      },
    });
    await expect(http.get("/api/me")).rejects.toMatchObject({ code: "S0401" });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onBusinessFailure).not.toHaveBeenCalled();
  });

  it("网络错误走 onHttpError", async () => {
    const onHttpError = vi.fn();
    const http = createHttpClient({
      adapter: async () => {
        throw new AxiosError("offline", "ERR_NETWORK");
      },
      hooks: { onHttpError },
    });
    await expect(http.get("/api/me")).rejects.toMatchObject({ kind: "network" });
    expect(onHttpError).toHaveBeenCalledTimes(1);
  });

  it("取消错误不提示", async () => {
    const onHttpError = vi.fn();
    const onBusinessFailure = vi.fn();
    const abort = new AbortController();
    abort.abort();
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({ data: okBody() })),
      hooks: { onHttpError, onBusinessFailure },
    });
    await expect(http.get("/api/me", null, { signal: abort.signal })).rejects.toMatchObject({
      kind: "cancelled",
    });
    expect(onHttpError).not.toHaveBeenCalled();
    expect(onBusinessFailure).not.toHaveBeenCalled();
  });

  it("并发前台请求计数归零才结束进度", async () => {
    const start = vi.fn();
    const done = vi.fn();
    const progress = new ProgressCounter({ start, done });
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({ data: okBody(), delay: 20 })),
      hooks: {
        onStart: () => progress.start(),
        onEnd: () => progress.done(),
      },
    });
    await Promise.all([http.get("/one"), http.get("/two")]);
    expect(start).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("silent progress 不触发进度 hooks", async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({ data: okBody() })),
      hooks: { onStart, onEnd },
    });
    await http.get("/api/me", null, { progress: "silent" });
    expect(onStart).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("外部 signal 不被 CancelManager 覆盖", async () => {
    const manager = new CancelManager();
    const abort = new AbortController();
    let seen: AbortSignal | undefined;
    const http = createHttpClient({
      cancelManager: manager,
      adapter: jsonAdapter((config) => {
        seen = config.signal;
        return { data: okBody() };
      }),
    });
    await http.get("/api/me", null, { signal: abort.signal });
    expect(seen).toBe(abort.signal);
    expect(manager.size()).toBe(0);
  });

  it("shouldBypassError 时保持 AxiosError 给后续拦截器", async () => {
    const challenge = vi.fn(async () => okBody({ retried: true }));
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({
        status: 412,
        data: { code: "CHALLENGE_REQUIRED", message: "need captcha", data: {} },
      })),
      hooks: {
        shouldBypassError: (error) => error.response?.status === 412,
      },
      interceptors: {
        response: [
          {
            order: 15,
            resolved: (response) => response,
            rejected: async () => challenge(),
          },
        ],
      },
    });
    const result = await http.get("/api/me");
    expect(challenge).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({ retried: true });
  });

  it("可组合请求拦截器按 order 执行", async () => {
    const seen: string[] = [];
    const http = createHttpClient({
      adapter: jsonAdapter((config) => {
        seen.push(`adapter:${config.headers.get("X-Trace")}`);
        return { data: okBody() };
      }),
      interceptors: {
        request: [
          {
            name: "header",
            order: 10,
            resolved: (config) => {
              seen.push("header");
              config.headers = AxiosHeaders.from(config.headers || {});
              config.headers.set("X-Trace", "h");
              return config;
            },
          },
          {
            name: "envelope",
            order: 25,
            resolved: (config) => {
              seen.push("envelope");
              return config;
            },
          },
        ],
      },
    });
    await http.get("/api/me");
    expect(seen).toEqual(["header", "envelope", "adapter:h"]);
  });

  it("同 order 时保持传入顺序（先 core 后 App）", async () => {
    const seen: string[] = [];
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({ data: okBody() })),
      interceptors: {
        request: [
          {
            name: "core",
            order: 12,
            resolved: (config) => {
              seen.push("core");
              return config;
            },
          },
          {
            name: "app",
            order: 12,
            resolved: (config) => {
              seen.push("app");
              return config;
            },
          },
        ],
      },
    });
    await http.get("/api/me");
    expect(seen).toEqual(["core", "app"]);
  });

  it("响应拦截器也是 order 越小越先执行", async () => {
    const seen: string[] = [];
    const http = createHttpClient({
      adapter: jsonAdapter(() => ({ data: okBody() })),
      interceptors: {
        response: [
          {
            name: "late",
            order: 15,
            resolved: (response) => {
              seen.push("late");
              return response;
            },
          },
          {
            name: "early",
            order: 5,
            resolved: (response) => {
              seen.push("early");
              return response;
            },
          },
        ],
      },
    });
    await http.get("/api/me");
    expect(seen).toEqual(["early", "late"]);
  });
});
