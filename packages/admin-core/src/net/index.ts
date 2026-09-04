import {
  createHttpClient,
  ProgressCounter,
  type HttpClient,
  type HttpRequestConfig,
  type R,
} from "@ingot/http-client";
import type { InNetConfig } from "@/plugin";
import NProgress from "@/components/nprogress";
import CancelManager from "./cancel";
import HeaderInterceptor from "./interceptor/request/header";
import EnvelopeRequestInterceptor from "./interceptor/request/envelope";
import EnvelopeResponseInterceptor from "./interceptor/response/envelope";
import ChallengeInterceptor from "./interceptor/response/challenge";
import { bindChallengeRetry } from "./challenge";
import {
  handleAdminBusinessFailure,
  handleAdminHttpError,
  handleAdminUnauthorized,
  isAdminUnauthorized,
  shouldBypassAdminError,
} from "./failure";

const progress = new ProgressCounter(NProgress);

class InHttpClient {
  private readonly client: HttpClient;

  constructor() {
    this.client = createHttpClient({
      timeout: 10_000,
      cancelManager: CancelManager,
      interceptors: {
        request: [HeaderInterceptor, EnvelopeRequestInterceptor],
        response: [EnvelopeResponseInterceptor, ChallengeInterceptor],
      },
      hooks: {
        onStart: () => progress.start(),
        onEnd: () => progress.done(),
        onBusinessFailure: handleAdminBusinessFailure,
        onUnauthorized: handleAdminUnauthorized,
        onHttpError: handleAdminHttpError,
        isUnauthorized: isAdminUnauthorized,
        shouldBypassError: shouldBypassAdminError,
      },
    });
    bindChallengeRetry((config) => this.client.rawRequest(config));
  }

  configure(net: InNetConfig): void {
    this.client.configure({
      baseURL: net.baseURL,
      timeout: net.timeout,
      timeoutErrorMessage: net.timeoutErrorMessage,
    });
  }

  rawRequest<T = unknown>(config: HttpRequestConfig): Promise<R<T>> {
    return this.client.rawRequest(config);
  }

  get<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.get(url, params, config);
  }

  delete<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.delete(url, params, config);
  }

  post<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.post(url, params, config);
  }

  put<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.put(url, params, config);
  }

  patch<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.patch(url, params, config);
  }

  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.head(url, config);
  }

  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.options(url, config);
  }

  postForm<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.postForm(url, params, config);
  }

  putForm<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.putForm(url, params, config);
  }

  patchForm<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.client.patchForm(url, params, config);
  }
}

export const Http = new InHttpClient();
export const request = Http;

export default Http;
export type { HttpRequestConfig, R };
export type { RequestOptions } from "@ingot/http-client";
