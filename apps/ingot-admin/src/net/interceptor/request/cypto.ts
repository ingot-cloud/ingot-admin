import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import type { PreFilter } from "@/net/types";
import { AES } from "@/utils/encrypt";

class CryptoInterceptor implements PreFilter {
  order(): number {
    return 20;
  }

  async resolved(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    if (config.aesEncryptKeys && config.aesEncryptKeys.length > 0) {
      if (config.data) {
        config.data = await AES({
          data: config.data,
          keys: config.aesEncryptKeys,
          mode: config.aesMode || "CBC",
        });
      }
      if (config.params) {
        config.params = await AES({
          data: config.params,
          keys: config.aesEncryptKeys,
          mode: config.aesMode || "CBC",
        });
      }
    }
    return Promise.resolve(config);
  }

  rejected(error: AxiosError): Promise<void> {
    return Promise.reject(error);
  }
}

export default new CryptoInterceptor();
