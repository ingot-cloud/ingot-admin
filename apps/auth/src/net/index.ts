import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  createHttpClient,
  ProgressCounter,
  type HttpClient,
  type HttpRequestConfig,
  type R,
} from "@ingot/http-client";
import NProgress from "@/components/nprogress";
import CancelManager from "./cancel";
import RequestInterceptor from "./interceptor/request";
import { EnvelopeInterceptor, ChallengeInterceptor } from "./interceptor/response";
import { bindChallengeRetry } from "./challenge";
import {
  handleAuthBusinessFailure,
  handleAuthHttpError,
  handleAuthUnauthorized,
  isAuthUnauthorized,
  shouldBypassAuthError,
} from "./failure";

const progress = new ProgressCounter(NProgress);

class Http {
  private readonly origin: AxiosInstance;
  private readonly client: HttpClient;

  constructor() {
    this.origin = axios.create({
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
      timeoutErrorMessage: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
    });
    this.client = createHttpClient({
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
      timeoutErrorMessage: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
      cancelManager: CancelManager,
      interceptors: {
        request: [RequestInterceptor],
        response: [EnvelopeInterceptor, ChallengeInterceptor],
      },
      hooks: {
        onStart: () => progress.start(),
        onEnd: () => progress.done(),
        onBusinessFailure: handleAuthBusinessFailure,
        onUnauthorized: handleAuthUnauthorized,
        onHttpError: handleAuthHttpError,
        isUnauthorized: isAuthUnauthorized,
        shouldBypassError: shouldBypassAuthError,
      },
    });
    bindChallengeRetry((config) => this.client.rawRequest(config));
  }

  getOrigin() {
    return this.origin;
  }

  rawRequest<T = unknown>(config: HttpRequestConfig): Promise<R<T>> {
    return this.client.rawRequest(config);
  }

  get<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.get(url, params, config);
  }

  delete<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.delete(url, params, config);
  }

  post<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.post(url, params, config);
  }

  put<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.put(url, params, config);
  }

  patch<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.patch(url, params, config);
  }

  head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.head(url, config);
  }

  options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.options(url, config);
  }

  postForm<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.postForm(url, params, config);
  }

  putForm<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.putForm(url, params, config);
  }

  patchForm<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.client.patchForm(url, params, config);
  }
}

export default new Http();
