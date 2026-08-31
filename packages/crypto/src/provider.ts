/**
 * 检测原生 WebCrypto SubtleCrypto 是否可用（需 Secure Context：HTTPS 或 localhost）
 */
export function isNativeSubtleAvailable(): boolean {
  return (
    typeof globalThis.isSecureContext === "boolean" &&
    globalThis.isSecureContext &&
    typeof globalThis.crypto !== "undefined" &&
    !!globalThis.crypto.subtle
  );
}

let subtlePromise: Promise<SubtleCrypto> | undefined;
let fallbackSubtle: SubtleCrypto | undefined;

/**
 * 获取 SubtleCrypto：Secure Context 用原生实现，否则懒加载 webcrypto-liner（独立实例，不替换 window.crypto）
 */
export async function getSubtleCrypto(): Promise<SubtleCrypto> {
  if (isNativeSubtleAvailable()) {
    console.debug("use native subtle");
    return globalThis.crypto.subtle;
  }
  if (!subtlePromise) {
    subtlePromise = import("webcrypto-liner/build/index.es.js").then((liner) => {
      fallbackSubtle = liner.crypto.subtle;
      if (!fallbackSubtle) {
        throw new Error("WebCrypto 降级加载失败：crypto.subtle 不可用");
      }
      return fallbackSubtle;
    });
  }
  return subtlePromise;
}

/**
 * 当前是否使用 webcrypto-liner 降级实例
 */
export function isFallbackCryptoActive(): boolean {
  return !isNativeSubtleAvailable() && !!fallbackSubtle;
}

/**
 * 信封加密是否可用（原生或降级均可）
 */
export function isCryptoSupported(): boolean {
  if (isNativeSubtleAvailable()) {
    return true;
  }
  return typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function";
}

/**
 * 生成指定长度的随机字节；HTTP 下 getRandomValues 通常仍可用
 */
export function randomBytes(length: number): Uint8Array {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}
