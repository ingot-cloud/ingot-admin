import type { InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { generateFingerprint } from "@ingot/shared";
import { useAppStore } from "@/stores/modules/app";

export default defineRequestInterceptor({
  name: "header",
  order: InterceptorOrder.request.header,
  async resolved(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    config.headers = config.headers || {};
    const appStore = useAppStore();
    if (appStore.app.login.fingerprintEnabled) {
      config.headers["In-Ca-Sig"] = await generateFingerprint().catch(() => "");
    }
    return config;
  },
});
