import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { R } from "@/models/net";
import RequestInterceptor from "./interceptor/request";
import ResponseInterceptor from "./interceptor/response";

class Http {
  private instance: AxiosInstance;
  public constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
      timeoutErrorMessage: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
    });

    RequestInterceptor.install(this.instance);
    ResponseInterceptor.install(this.instance);
  }

  rawRequest<T = any>(config: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.request(config);
  }

  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    config = config || {};
    if (params) {
      config.params = Object.assign({}, config.params, params);
    }
    return this.instance.get<T, R<T>>(url, config);
  }

  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    config = config || {};
    if (params) {
      config.data = Object.assign({}, config.data, params);
    }
    return this.instance.delete<T, R<T>>(url, config);
  }

  post<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.post<T, R<T>>(url, params, config);
  }

  put<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.put<T, R<T>>(url, params, config);
  }

  patch<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.patch<T, R<T>>(url, params, config);
  }

  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.head<T, R<T>>(url, config);
  }

  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.options<T, R<T>>(url, config);
  }

  postForm<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.postForm(url, params, config);
  }

  putForm<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.putForm(url, params, config);
  }

  patchForm<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<R<T>> {
    return this.instance.patchForm(url, params, config);
  }
}

export default new Http();
