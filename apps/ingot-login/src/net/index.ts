import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { onRequestFulfilled, onRequestRejected } from "./interceptor/request";
import { onResponseFulfilled, onResponseRejected } from "./interceptor/response";
import type { R } from "@/models";
import NProgress from "@/components/nprogress";
import CancelManager from "./cancel";

class Http {
  private instance: AxiosInstance;
  private origin: AxiosInstance;
  public constructor() {
    this.origin = axios.create({
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
      timeoutErrorMessage: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
    });
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
      timeoutErrorMessage: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
    });

    // default interceptors
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        NProgress.start();
        CancelManager.addRequest(config);
        return onRequestFulfilled(config);
      },
      (error: AxiosError) => {
        return onRequestRejected(error);
      },
    );
    this.instance.interceptors.response.use(
      (response: AxiosResponse<R>) => {
        NProgress.done();
        CancelManager.removeRequest(response.config);
        return onResponseFulfilled(response);
      },
      (error: AxiosError<R>) => {
        NProgress.done();
        CancelManager.removeRequest(error.config);
        return onResponseRejected(error);
      },
    );
  }

  getOrigin() {
    return this.origin;
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
