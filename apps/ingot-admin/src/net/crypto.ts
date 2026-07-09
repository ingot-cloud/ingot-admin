import axios from "axios";
import type { AxiosResponse } from "axios";
import Http from "@/net";
import type { R } from "@/models/net";
import {
  KeyStore,
  CRYPTO_MD_V1,
  DEFAULT_HEADER_NAMES,
  type PublicKeyInfo,
  type CryptoHeaderNames,
} from "@ingot/crypto";

const PUBLIC_KEYS_PATH = "/api/crypto/public-keys";

/**
 * 协议头名称，如后端重命名在此调整
 */
export const cryptoHeaderNames: CryptoHeaderNames = DEFAULT_HEADER_NAMES;

const PUBLIC_KEY_STORAGE_KEY = `${import.meta.env.VITE_APP_STORE_PREFIX}:crypto:public-key`;

/**
 * 公钥缓存与轮换管理单例，公钥拉取复用应用 Http 实例。
 * sessionStorage 按子域独立缓存，刷新页面后可复用公钥。
 */
export const keyStore = new KeyStore({
  fetcher: async () => {
    const res = await Http.get<PublicKeyInfo[]>(PUBLIC_KEYS_PATH, null, {
      permit: true,
      manualProcessingFailure: true,
    });
    return res.data;
  },
  storageKey: PUBLIC_KEY_STORAGE_KEY,
});

/**
 * 未经拦截器处理的原始实例，用于信封加密的 kid 失效重试
 */
export const rawInstance = axios.create();

/**
 * 读取响应头（axios 响应头统一为小写）
 */
export function readCryptoHeader(response: AxiosResponse<R>, name: string): string | undefined {
  const value = response.headers?.[name.toLowerCase()];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return undefined;
}

/**
 * 响应头 Kv 与本地 kid 不一致时异步刷新公钥（被动感知密钥轮换）
 */
export function maybeRefreshKeyOnKidMismatch(response: AxiosResponse<R>): void {
  if (!isEnvelopeResponse(response)) {
    return;
  }
  const responseKid = readCryptoHeader(response, cryptoHeaderNames.kv);
  if (!responseKid) {
    return;
  }
  const activeKid = keyStore.getActiveKid();
  if (!activeKid || responseKid !== activeKid) {
    keyStore.refresh().catch(() => undefined);
  }
}

/**
 * 判断响应是否为信封加密（响应头 Md === h1）
 */
export function isEnvelopeResponse(response: AxiosResponse<R>): boolean {
  return readCryptoHeader(response, cryptoHeaderNames.md) === CRYPTO_MD_V1;
}
