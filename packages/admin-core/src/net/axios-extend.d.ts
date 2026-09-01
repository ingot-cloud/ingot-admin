// Ensure this file is parsed as a module regardless of dependencies.
export {};

import type { CryptoOption, EnvelopeContext } from "@ingot/shared/crypto";

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

    /**
     * 信封加密配置：分别声明请求方向与响应方向如何加解密。
     * 请求或响应任一方向存在即触发握手并携带协议头。
     */
    crypto?: CryptoOption;

    /**
     * 内部：信封加密本次请求的握手上下文，用于解密响应
     */
    __cryptoCtx?: EnvelopeContext;

    /**
     * 内部：保留的原始请求体明文，用于 kid 失效重试时重新加密
     */
    __cryptoPlainData?: unknown;

    /**
     * 内部：保留的原始 query 参数明文（query 模式），用于 kid 失效重试时重新加密
     */
    __cryptoPlainParams?: unknown;

    /**
     * 内部：信封加密是否已因 kid 失效重试过
     */
    __cryptoRetried?: boolean;

    /**
     * 跳过网关 412 挑战拦截（验证码拉码/验码自身使用）
     */
    skipChallenge?: boolean;

    /**
     * 内部：网关挑战重试次数
     */
    __challengeRetryCount?: number;
  }
}
