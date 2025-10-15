import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import type { PreFilter } from "@/net/types";
import { useAuthStore } from "@/stores/modules/auth";

class HeaderInterceptor implements PreFilter {
  order(): number {
    return 10;
  }

  resolved(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    config.headers = config.headers || {};
    if (!config.permit) {
      if (!config.headers["Authorization"]) {
        const getAccessToken = storeToRefs(useAuthStore()).getAccessToken;
        if (getAccessToken.value) {
          config.headers["Authorization"] = getAccessToken.value;
        }
      }
    }

    if (!config.ignoreTenant) {
      if (!config.headers["Tenant"]) {
        config.headers["Tenant"] = storeToRefs(useAuthStore()).getOrg.value;
      }
    }
    return config;
  }

  rejected(error: AxiosError): Promise<void> {
    return Promise.reject(error);
  }
}

export default new HeaderInterceptor();
