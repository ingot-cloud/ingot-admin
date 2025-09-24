// Ensure this file is parsed as a module regardless of dependencies.
export {};

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * 是否手动处理失败流程
     * 默认自动交由公共失败处理器处理
     */
    manualProcessingFailure?: boolean;

    /**
     * 是否手动处理中断。
     * 默认情况下，所有请求会自动加入到CancelManager中，可以统一中断所有请求，
     * 如果手动
     */
    manualProcessingAbort?: boolean;

    /**
     * 是否为刷新token后的请求重试
     */
    refreshTokenAndRetry?: boolean;

    /**
     * 公共请求，不携带token
     */
    permit?: boolean;

    /**
     * 请求头忽略传递 tenant
     */
    ignoreTenant?: boolean;
  }
}
