import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { R } from "@/models/net";
import type { InNetConfig } from "@/plugin";
import RequestInterceptor from "./interceptor/request";
import ResponseInterceptor from "./interceptor/response";
import { bindChallengeRetry } from "./challenge";

class InHttpClient {
  private instance: AxiosInstance;
  public constructor() {
    this.instance = axios.create({
      timeout: 10_000,
    });

    RequestInterceptor.install(this.instance);
    ResponseInterceptor.install(this.instance);
    bindChallengeRetry((config) => this.instance.request(config));
  }

  configure(net: InNetConfig): void {
    this.instance.defaults.baseURL = net.baseURL;
    this.instance.defaults.timeout = net.timeout ?? 10_000;
    this.instance.defaults.timeoutErrorMessage = net.timeoutErrorMessage;
  }

  rawRequest<T = unknown>(config: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.request(config);
  }

  get<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    config = config || {};
    if (params) {
      config.params = Object.assign({}, config.params, params);
    }
    return this.instance.get<T, R<T>>(url, config);
  }

  delete<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    config = config || {};
    if (params) {
      config.data = Object.assign({}, config.data, params);
    }
    return this.instance.delete<T, R<T>>(url, config);
  }

  post<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.post<T, R<T>>(url, params, config);
  }

  put<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.put<T, R<T>>(url, params, config);
  }

  patch<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.patch<T, R<T>>(url, params, config);
  }

  head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.head<T, R<T>>(url, config);
  }

  options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.options<T, R<T>>(url, config);
  }

  postForm<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.postForm(url, params, config);
  }

  putForm<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.putForm(url, params, config);
  }

  patchForm<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.patchForm(url, params, config);
  }
}

export const Http = new InHttpClient();
export const request = Http;

export default Http;
