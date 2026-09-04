import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { CancelManager } from "./cancel";
import {
  axiosResponseToR,
  classifyAxiosError,
  createBusinessError,
  createUnknownResponse,
  isApiError,
  type ApiError,
} from "./error";
import { installRequestInterceptors, installResponseInterceptors } from "./interceptors";
import { resolveFeedback, resolveProgress } from "./options";
import type {
  HttpClient,
  HttpClientConfigureOptions,
  HttpClientHooks,
  HttpClientOptions,
  HttpRequestConfig,
  PostFilter,
  PreFilter,
  R,
} from "./types";
import { DEFAULT_SUCCESS_CODE } from "./types";

class AxiosHttpClient implements HttpClient {
  private readonly instance: AxiosInstance;

  constructor(clientOptions: HttpClientOptions) {
    this.instance = axios.create({
      baseURL: clientOptions.baseURL,
      timeout: clientOptions.timeout ?? 10_000,
      timeoutErrorMessage: clientOptions.timeoutErrorMessage,
      adapter: clientOptions.adapter,
    });

    const cancelManager = clientOptions.cancelManager ?? new CancelManager();
    const hooks = clientOptions.hooks ?? {};
    const requestInterceptors: PreFilter[] = [
      createLifecycleRequestInterceptor(cancelManager, hooks),
      ...(clientOptions.interceptors?.request ?? []),
    ];
    const responseInterceptors: PostFilter[] = [
      createLifecycleResponseInterceptor(cancelManager, hooks),
      ...(clientOptions.interceptors?.response ?? []),
      createNormalizeInterceptor(clientOptions.successCode ?? DEFAULT_SUCCESS_CODE, hooks),
    ];
    installRequestInterceptors(this.instance, requestInterceptors);
    installResponseInterceptors(this.instance, responseInterceptors);
  }

  configure(options: HttpClientConfigureOptions): void {
    if (options.baseURL !== undefined) {
      this.instance.defaults.baseURL = options.baseURL;
    }
    if (options.timeout !== undefined) {
      this.instance.defaults.timeout = options.timeout;
    }
    if (options.timeoutErrorMessage !== undefined) {
      this.instance.defaults.timeoutErrorMessage = options.timeoutErrorMessage;
    }
  }

  rawRequest<T = unknown>(config: HttpRequestConfig): Promise<R<T>> {
    return this.instance.request(config);
  }

  get<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    const next = config || {};
    if (params) {
      next.params = Object.assign({}, next.params, params);
    }
    return this.instance.get<T, R<T>>(url, next);
  }

  delete<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    const next = config || {};
    if (params) {
      next.data = Object.assign({}, next.data, params);
    }
    return this.instance.delete<T, R<T>>(url, next);
  }

  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.post<T, R<T>>(url, data, config);
  }

  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.put<T, R<T>>(url, data, config);
  }

  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.patch<T, R<T>>(url, data, config);
  }

  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.head<T, R<T>>(url, config);
  }

  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.options<T, R<T>>(url, config);
  }

  postForm<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.postForm(url, data, config);
  }

  putForm<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.putForm(url, data, config);
  }

  patchForm<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.instance.patchForm(url, data, config);
  }
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  return new AxiosHttpClient(options);
}

const createLifecycleRequestInterceptor = (
  cancelManager: CancelManager,
  hooks: HttpClientHooks,
): PreFilter => ({
  order: () => 1,
  resolved(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (resolveProgress(config) === "global") {
      hooks.onStart?.(config);
    }
    cancelManager.addRequest(config);
    return config;
  },
  rejected(error: AxiosError): Promise<unknown> {
    if (resolveProgress(error.config) === "global") {
      hooks.onStart?.(error.config as InternalAxiosRequestConfig);
    }
    cancelManager.addRequest(error.config);
    return Promise.reject(error);
  },
});

const createLifecycleResponseInterceptor = (
  cancelManager: CancelManager,
  hooks: HttpClientHooks,
): PostFilter => ({
  order: () => 1,
  resolved(response: AxiosResponse<R>): AxiosResponse<R> {
    if (resolveProgress(response.config) === "global") {
      hooks.onEnd?.(response.config);
    }
    cancelManager.removeRequest(response.config);
    return response;
  },
  rejected(error: AxiosError): Promise<unknown> {
    if (resolveProgress(error.config) === "global") {
      hooks.onEnd?.(error.config);
    }
    cancelManager.removeRequest(error.config);
    return Promise.reject(error);
  },
});

const createNormalizeInterceptor = (successCode: string, hooks: HttpClientHooks): PostFilter => ({
  order: () => 10,
  resolved(response: AxiosResponse<R>): R | Promise<R> {
    const data = response.data;
    if (data?.code === successCode) {
      return axiosResponseToR(response);
    }
    const normalized = axiosResponseToR(response);
    return settleFailure(createBusinessError(normalized, response.config), response.config, hooks);
  },
  rejected(error: AxiosError): Promise<unknown> {
    if (hooks.shouldBypassError?.(error)) {
      return Promise.reject(error);
    }
    const classified = isApiError(error)
      ? error
      : classifyAxiosError(error, axiosResponseToR(error.response as AxiosResponse<R> | undefined));
    return settleFailure(classified, error.config, hooks);
  },
});

const settleFailure = async (
  error: ApiError,
  config: AxiosRequestConfig | undefined,
  hooks: HttpClientHooks,
): Promise<never> => {
  if (error.cancelled || resolveFeedback(config) === "silent") {
    return Promise.reject(error);
  }
  if (hooks.isUnauthorized?.(error)) {
    await hooks.onUnauthorized?.(error);
    return Promise.reject(error);
  }
  if (error.kind === "business") {
    await hooks.onBusinessFailure?.(error);
    return Promise.reject(error);
  }
  await hooks.onHttpError?.(error);
  return Promise.reject(error);
};

export const createUnknownHttpResponse = createUnknownResponse;
