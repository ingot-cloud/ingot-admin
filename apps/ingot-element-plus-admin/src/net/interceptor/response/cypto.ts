import type { AxiosResponse, AxiosError } from "axios";
import type { PostFilter } from "@/net/types";
import type { R } from "@/models/net";
import { AES } from "@/utils/encrypt";
import { tr } from "element-plus/es/locales.mjs";

class CryptoInterceptor implements PostFilter {
  order(): number {
    return 20;
  }

  async resolved(response: AxiosResponse<R>): Promise<AxiosResponse<R>> {
    const config = response.config;
    if (config.aesDecryptKeys && config.aesDecryptKeys.length > 0) {
      response.data = await AES({
        data: response.data,
        keys: config.aesDecryptKeys,
        mode: config.aesMode || "CBC",
        action: "decrypt",
      });
    }
    return Promise.resolve(response);
  }

  rejected(error: AxiosError): Promise<void> {
    return Promise.reject(error);
  }
}

export default new CryptoInterceptor();
