import axios, { AxiosError, CanceledError } from "axios";
import { describe, expect, it } from "vitest";
import { classifyAxiosError, createBusinessError, isApiError } from "./error";
import type { R } from "./types";

const asR = (overrides: Partial<R> = {}): R =>
  ({
    code: "S0500",
    message: "失败",
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
    ...overrides,
  }) as R;

describe("ApiError", () => {
  it("业务错误不可重试", () => {
    const error = createBusinessError(asR({ code: "S0002", message: "非法操作" }));
    expect(error.kind).toBe("business");
    expect(error.code).toBe("S0002");
    expect(error.retriable).toBe(false);
    expect(error.cancelled).toBe(false);
    expect(isApiError(error)).toBe(true);
  });

  it("将取消错误分类为 cancelled 且不重试", () => {
    const canceled = new CanceledError("canceled");
    const error = classifyAxiosError(canceled);
    expect(error.kind).toBe("cancelled");
    expect(error.cancelled).toBe(true);
    expect(error.retriable).toBe(false);
  });

  it("将超时错误分类为 timeout 且可重试", () => {
    const timeout = new AxiosError("timeout", "ECONNABORTED");
    const error = classifyAxiosError(timeout);
    expect(error.kind).toBe("timeout");
    expect(error.retriable).toBe(true);
  });

  it("将无响应错误分类为 network 且可重试", () => {
    const network = new AxiosError("offline", "ERR_NETWORK");
    const error = classifyAxiosError(network);
    expect(error.kind).toBe("network");
    expect(error.retriable).toBe(true);
  });

  it("将 503 分类为可重试 http 错误", () => {
    const httpError = new AxiosError("bad gateway");
    httpError.response = {
      data: { code: "-1", message: "unavailable", data: {} },
      status: 503,
      statusText: "Service Unavailable",
      headers: {},
      config: { headers: axios.AxiosHeaders.from({}) },
    };
    const error = classifyAxiosError(httpError);
    expect(error.kind).toBe("http");
    expect(error.status).toBe(503);
    expect(error.retriable).toBe(true);
  });

  it("将 404 分类为不可重试 http 错误", () => {
    const httpError = new AxiosError("not found");
    httpError.response = {
      data: { code: "S0404", message: "not found", data: {} },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: axios.AxiosHeaders.from({}) },
    };
    const error = classifyAxiosError(httpError);
    expect(error.kind).toBe("http");
    expect(error.retriable).toBe(false);
    expect(error.code).toBe("S0404");
  });
});
