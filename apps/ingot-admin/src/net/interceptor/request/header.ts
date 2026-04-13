import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import type { PreFilter } from "@/net/types";
import { generateFingerprint } from "@ingot/utils";
import { useAppStore } from "@/stores/modules/app";

class HeaderInterceptor implements PreFilter {
  order(): number {
    return 10;
  }

  async resolved(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    config.headers = config.headers || {};
    const appStore = useAppStore();
    if (appStore.app.login.fingerprintEnabled) {
      config.headers["X-In-Ca-Sig"] = await generateFingerprint().catch(() => "");
    }
    return config;
  }

  rejected(error: AxiosError): Promise<void> {
    return Promise.reject(error);
  }
}

export default new HeaderInterceptor();
