/**
 * 服务端公钥信息（GET /crypto/public-keys 返回项）
 */
export interface PublicKeyInfo {
  kid: string;
  alg: string;
  publicKey: string;
  active: boolean;
}

/**
 * 协议头名称配置，默认值可被后端重命名后覆盖
 */
export interface CryptoHeaderNames {
  md: string;
  kv: string;
  sk: string;
  no: string;
  ts: string;
  alg?: string;
  enc?: string;
}

/**
 * 一次请求的信封上下文，用于解密本次响应
 */
export interface EnvelopeContext {
  cek: Uint8Array;
  aad: Uint8Array;
  kid: string;
  nonce: string;
  ts: string;
}

/**
 * 字段级模式下字段解密后的目标类型
 */
export type CryptoFieldType = "string" | "number" | "boolean" | "object" | "array";

/**
 * 字段配置：字符串（默认 string 类型）或带类型的对象
 */
export interface CryptoFieldConfig {
  key: string;
  type?: CryptoFieldType;
}

/**
 * 字段清单，支持简单/配置/混合三种写法
 */
export type CryptoFields = Array<string | CryptoFieldConfig>;

/**
 * 请求方向加密模式：整体请求体 / URL 参数（GET）/ 字段级
 */
export type CryptoRequestMode = "whole" | "query" | "field";

/**
 * query 模式默认 URL 参数名（与后端 ingot.crypto.param-key 对齐）
 */
export const DEFAULT_QUERY_PARAM_KEY = "data";

/**
 * 响应方向解密模式：仅 data / 整体 / 字段级
 */
export type CryptoResponseMode = "data_only" | "full" | "field";

/**
 * 请求方向加密配置，field 模式需提供 fields，query 模式可配置 paramKey
 */
export interface CryptoRequestOption {
  mode: CryptoRequestMode;
  fields?: CryptoFields;
  /** query 模式下的 URL 参数名，默认 data */
  paramKey?: string;
}

/**
 * 响应方向解密配置，field 模式需提供 fields
 */
export interface CryptoResponseOption {
  mode: CryptoResponseMode;
  fields?: CryptoFields;
}

/**
 * 单次请求的加解密配置，请求与响应方向相互独立
 */
export interface CryptoOption {
  request?: CryptoRequestOption;
  response?: CryptoResponseOption;
}

/**
 * 加密错误码（明文 R.code）
 */
export enum CryptoErrorCode {
  HeaderMissing = "crypto_header_missing",
  KidUnknown = "crypto_kid_unknown",
  KeyUnwrapError = "crypto_key_unwrap_error",
  IntegrityError = "crypto_integrity_error",
  AlgUnsupported = "crypto_alg_unsupported",
  ReplayTsExpired = "replay_ts_expired",
  ReplayNonceDup = "replay_nonce_dup",
}

/**
 * 信封加密协议版本标识
 */
export const CRYPTO_MD_V1 = "h1";

/**
 * 默认协议头名称
 */
export const DEFAULT_HEADER_NAMES: CryptoHeaderNames = {
  md: "In-Crypto-Md",
  kv: "In-Crypto-Kv",
  sk: "In-Crypto-Sk",
  no: "In-Crypto-No",
  ts: "In-Crypto-Ts",
  alg: "In-Crypto-Al",
  enc: "In-Crypto-En",
};
