import { CanceledError, type InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { generateFingerprint } from "@ingot/shared";
import { useAppStore } from "@/stores/modules/app";
import { usePermissions } from "@/stores/modules/auth";

export default defineRequestInterceptor({
  name: "header",
  order: InterceptorOrder.request.header,
  async resolved(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    const epoch = config.__ingotIdentityEpoch ?? usePermissions().contextEpoch;
    config.__ingotIdentityEpoch = epoch;
    if (epoch !== usePermissions().contextEpoch)
      throw new CanceledError("身份已变化，已取消旧请求", config);
    config.headers = config.headers || {};
    const appStore = useAppStore();
    if (appStore.app.login.fingerprintEnabled) {
      config.headers["In-Ca-Sig"] = await generateFingerprint().catch(() => "");
    }
    if (epoch !== usePermissions().contextEpoch)
      throw new CanceledError("身份已变化，已取消旧请求", config);
    return config;
  },
});
