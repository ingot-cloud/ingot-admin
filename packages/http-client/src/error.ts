import type { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { DEFAULT_UNKNOWN_MESSAGE, type R } from "./types";

export type ApiErrorKind = "business" | "http" | "network" | "timeout" | "cancelled";

export interface ApiErrorInit<T = unknown> {
  kind: ApiErrorKind;
  message: string;
  code?: string;
  status?: number;
  retriable?: boolean;
  cancelled?: boolean;
  response?: R<T>;
  cause?: unknown;
  config?: AxiosRequestConfig;
}

const RETRIABLE_HTTP_STATUS = new Set([502, 503, 504]);

export class ApiError<T = unknown> extends Error {
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly status?: number;
  readonly retriable: boolean;
  readonly cancelled: boolean;
  readonly response?: R<T>;
  readonly config?: AxiosRequestConfig;
  readonly cause?: unknown;

  constructor(init: ApiErrorInit<T>) {
    super(init.message);
    this.name = "ApiError";
    this.kind = init.kind;
    this.code = init.code;
    this.status = init.status;
    this.retriable = init.retriable ?? false;
    this.cancelled = init.cancelled ?? init.kind === "cancelled";
    this.response = init.response;
    this.config = init.config;
    this.cause = init.cause;
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;

export const createUnknownResponse = (): R =>
  ({
    code: "-1",
    message: DEFAULT_UNKNOWN_MESSAGE,
    data: {},
    status: -1,
    statusText: DEFAULT_UNKNOWN_MESSAGE,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }) as R;

export const axiosResponseToR = <T = unknown>(response?: AxiosResponse<R<T>>): R<T> => {
  if (!response || !response.data) {
    return createUnknownResponse() as R<T>;
  }
  const body = response.data as R<T> & { msg?: string };
  return Object.assign({}, response, {
    data: body.data,
    message: body.message || body.msg || "",
    code: body.code,
  }) as R<T>;
};

const isCanceledError = (error: AxiosError): boolean => {
  if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
    return true;
  }
  const cause = error.cause;
  return cause instanceof Error && (cause.name === "AbortError" || cause.name === "CanceledError");
};

export const classifyAxiosError = (error: AxiosError, fallback: R = createUnknownResponse()): ApiError => {
  const config = error.config;
  if (isCanceledError(error)) {
    return new ApiError({
      kind: "cancelled",
      message: error.message || "请求已取消",
      cancelled: true,
      retriable: false,
      config,
      cause: error,
    });
  }

  const code = error.code ?? "";
  if (code === "ECONNABORTED" || code === "ETIMEDOUT" || code === "ERR_TIMEOUT") {
    return new ApiError({
      kind: "timeout",
      message: error.message || fallback.message,
      code: fallback.code,
      status: error.response?.status,
      retriable: true,
      response: error.response ? axiosResponseToR(error.response as AxiosResponse<R>) : fallback,
      config,
      cause: error,
    });
  }

  if (!error.response) {
    return new ApiError({
      kind: "network",
      message: error.message || fallback.message,
      code: fallback.code,
      retriable: true,
      response: fallback,
      config,
      cause: error,
    });
  }

  const response = axiosResponseToR(error.response as AxiosResponse<R>);
  const status = error.response.status;
  return new ApiError({
    kind: "http",
    message: response.message || error.message || fallback.message,
    code: response.code,
    status,
    retriable: RETRIABLE_HTTP_STATUS.has(status),
    response,
    config,
    cause: error,
  });
};

export const createBusinessError = <T = unknown>(response: R<T>, config?: AxiosRequestConfig): ApiError<T> =>
  new ApiError<T>({
    kind: "business",
    message: response.message || DEFAULT_UNKNOWN_MESSAGE,
    code: response.code,
    status: response.status,
    retriable: false,
    response,
    config,
  });
