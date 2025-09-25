import { encryptCBC, decryptCBC } from "./aes/aes_cbc";
import { encryptGCM, decryptGCM } from "./aes/aes_gcm";

export interface AESParams<T> {
  data: T;
  keys: Array<string>;
  encodeKey?: string;
  /**
   * 模式，默认CBC
   */
  mode?: "CBC" | "GCM"; // 默认CBC
  action?: "encrypt" | "decrypt"; // 默认encrypt
}

/**
 * AES 加密处理
 */
export const AES = async <T>(params: AESParams<T>) => {
  params.action = params.action || "encrypt";
  params.mode = params.mode || "CBC";

  if (!params.encodeKey) {
    throw new Error("encodeKey is required");
  }

  const { data, keys, mode, action } = params;
  const encodeKey = params.encodeKey;
  const result = JSON.parse(JSON.stringify(data));

  for (const key of keys) {
    try {
      const value = result[key];
      console.log(2, value);
      if (action === "encrypt") {
        result[key] =
          mode === "GCM" ? await encryptGCM(value, encodeKey) : encryptCBC(value, encodeKey);
      } else {
        result[key] =
          mode === "GCM" ? await decryptGCM(value, encodeKey) : decryptCBC(value, encodeKey);
      }
    } catch (error) {
      console.error("aes error", error);
    }
  }

  return result as T;
};
