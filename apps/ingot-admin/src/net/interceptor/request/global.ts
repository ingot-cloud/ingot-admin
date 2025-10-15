import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import type { PreFilter } from "@/net/types";
import NProgress from "@/components/nprogress";
import CancelManager from "@/net/cancel";

class GlobalInterceptor implements PreFilter {
  order(): number {
    return 1;
  }

  resolved(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    NProgress.start();
    CancelManager.addRequest(config);
    return config;
  }

  rejected(error: AxiosError): Promise<void> {
    NProgress.start();
    CancelManager.addRequest(error.config);
    return Promise.reject(error);
  }
}

export default new GlobalInterceptor();
