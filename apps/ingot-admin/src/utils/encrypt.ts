import { AES as AESUtils, type AESParams } from "@ingot/utils";

/**
 * AES 加密处理
 */
export const AES = async <T>(params: AESParams<T>) => {
  params.action = params.action || "encrypt";
  params.mode = params.mode || "CBC";
  params.encodeKey = params.encodeKey || import.meta.env.VITE_APP_AES;
  return AESUtils(params);
};
