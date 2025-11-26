// Ensure this file is parsed as a module regardless of dependencies.
export {};

import type { AESKeysConfig } from "@ingot/utils";

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
     * 请求参数中需要加密的字段配置
     * 支持三种格式：
     * 1. 简单格式：['phone', 'email'] - 默认为 string 类型
     * 2. 配置格式：[{ key: 'phone', type: 'string' }, { key: 'status', type: 'object' }]
     * 3. 混合格式：['phone', { key: 'status', type: 'object' }]
     */
    aesEncryptKeys?: AESKeysConfig;

    /**
     * 响应数据中需要解密的字段配置
     * 支持三种格式：
     * 1. 简单格式：['phone', 'email'] - 解密后为 string 类型
     * 2. 配置格式：[{ key: 'phone', type: 'string' }, { key: 'isActive', type: 'boolean' }]
     * 3. 混合格式：['phone', { key: 'isActive', type: 'boolean' }]
     *
     * type 说明：
     * - string: 解密后保持字符串（默认）
     * - number: 解密后转换为数字
     * - boolean: 解密后转换为布尔值
     * - object: 解密后通过 JSON.parse 转换为对象
     * - array: 解密后通过 JSON.parse 转换为数组
     */
    aesDecryptKeys?: AESKeysConfig;

    /**
     * 加解密模式，默认CBC
     */
    aesMode?: "CBC" | "GCM";
  }
}
