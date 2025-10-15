import type {
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosInterceptorOptions,
  AxiosResponse,
} from "axios";

import type { R } from "@/models/net";

export interface PreFilter {
  order(): number;

  resolved(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

  rejected(error: AxiosError): Promise<void>;

  options?: AxiosInterceptorOptions;
}

export interface PostFilter {
  order(): number;

  resolved(response: AxiosResponse<R>): AxiosResponse<R> | Promise<AxiosResponse<R>>;

  rejected(error: AxiosError): Promise<any>;
}
