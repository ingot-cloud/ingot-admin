import type {
  AxiosAdapter,
  AxiosError,
  AxiosInterceptorOptions,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * 业务响应信封。保留 AxiosResponse 字段以兼容现有调用方。
 */
export interface R<T = unknown> extends AxiosResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface RequestOptions {
  signal?: AbortSignal;
  feedback?: "global" | "silent";
  progress?: "global" | "silent";
}

export type HttpRequestConfig = AxiosRequestConfig;

export interface HttpClient {
  configure(options: HttpClientConfigureOptions): void;
  rawRequest<T = unknown>(config: HttpRequestConfig): Promise<R<T>>;
  get<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  delete<T = unknown>(url: string, params?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>>;
  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<R<T>>;
  postForm<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  putForm<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
  patchForm<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<R<T>>;
}

export interface HttpClientConfigureOptions {
  baseURL?: string;
  timeout?: number;
  timeoutErrorMessage?: string;
}

export interface HttpClientHooks {
  onStart?: (config: InternalAxiosRequestConfig) => void;
  onEnd?: (config?: InternalAxiosRequestConfig) => void;
  onBusinessFailure?: (error: import("./error").ApiError) => void | Promise<void>;
  onUnauthorized?: (error: import("./error").ApiError) => void | Promise<void>;
  onHttpError?: (error: import("./error").ApiError) => void | Promise<void>;
  /**
   * 返回 true 时不转换为 ApiError，交给后续拦截器（例如 412 挑战）。
   */
  shouldBypassError?: (error: AxiosError) => boolean;
  /**
   * 判断业务失败是否视为未授权。
   */
  isUnauthorized?: (error: import("./error").ApiError) => boolean;
}

export interface PreFilter {
  order(): number;
  resolved(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  rejected(error: AxiosError): Promise<unknown>;
  options?: AxiosInterceptorOptions;
}

export interface PostFilter {
  order(): number;
  resolved(
    response: AxiosResponse<R>,
  ): AxiosResponse<R> | R | Promise<AxiosResponse<R> | R>;
  rejected(error: AxiosError): Promise<unknown>;
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  timeoutErrorMessage?: string;
  successCode?: string;
  adapter?: AxiosAdapter;
  interceptors?: {
    request?: PreFilter[];
    response?: PostFilter[];
  };
  hooks?: HttpClientHooks;
  cancelManager?: import("./cancel").CancelManager;
}

export const DEFAULT_SUCCESS_CODE = "S0200";
export const DEFAULT_UNKNOWN_MESSAGE = "网络异常，请稍后重试";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * 失败反馈：global 走适配器提示，silent 由调用方或 Query 接管。
     */
    feedback?: "global" | "silent";
    /**
     * 进度条：global 计入前台请求，silent 不触发全局进度。
     */
    progress?: "global" | "silent";
    /**
     * @deprecated 使用 `feedback: "silent"`
     */
    manualProcessingFailure?: boolean;
    /**
     * @deprecated 传入 `signal` 或由调用方自行取消
     */
    manualProcessingAbort?: boolean;
  }
}
