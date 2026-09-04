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
import { mergeAdminNetInterceptors } from "./core-interceptors";
import { bindChallengeRetry } from "./challenge";
import {
  handleAdminBusinessFailure,
  handleAdminHttpError,
  handleAdminUnauthorized,
  isAdminUnauthorized,
  shouldBypassAdminError,
} from "./failure";

const progress = new ProgressCounter(NProgress);

const createAdminHttpClient = (net?: InNetConfig): HttpClient => {
  const client = createHttpClient({
    baseURL: net?.baseURL,
    timeout: net?.timeout ?? 10_000,
    timeoutErrorMessage: net?.timeoutErrorMessage,
    cancelManager: CancelManager,
    interceptors: mergeAdminNetInterceptors(net?.interceptors),
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
  bindChallengeRetry((config) => client.rawRequest(config));
  return client;
};

class InHttpClient {
  private client: HttpClient | undefined;

  private resolveClient(): HttpClient {
    if (!this.client) {
      this.client = createAdminHttpClient();
    }
    return this.client;
  }

  configure(net: InNetConfig): void {
    this.client = createAdminHttpClient(net);
  }

  rawRequest<T = unknown>(config: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().rawRequest(config);
  }

  get<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().get(url, params, config);
  }

  delete<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().delete(url, params, config);
  }

  post<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().post(url, params, config);
  }

  put<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().put(url, params, config);
  }

  patch<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().patch(url, params, config);
  }

  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().head(url, config);
  }

  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().options(url, config);
  }

  postForm<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().postForm(url, params, config);
  }

  putForm<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().putForm(url, params, config);
  }

  patchForm<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>> {
    return this.resolveClient().patchForm(url, params, config);
  }
}

export const Http = new InHttpClient();
export const request = Http;

export default Http;
export type { HttpRequestConfig, R };
export type { PostFilter, PreFilter, RequestOptions } from "@ingot/http-client";
export {
  defineRequestInterceptor,
  defineResponseInterceptor,
  InterceptorOrder as AdminNetInterceptorOrder,
} from "@ingot/http-client";
export {
  CORE_REQUEST_INTERCEPTORS,
  CORE_RESPONSE_INTERCEPTORS,
  mergeAdminNetInterceptors,
} from "./core-interceptors";
