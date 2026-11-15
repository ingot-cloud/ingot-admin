import { CanceledError, type InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { generateFingerprint } from "@ingot/shared";
import { useAppStore } from "@/stores/modules/app";
import { usePermissions } from "@/stores/modules/auth";
import { getAdminRuntimeConfig } from "@/runtime";
import { assertCurrentIdentity } from "./identity";
import {
  BFF_CONTEXT_HEADER,
  hasPendingLogout,
  currentSessionContext,
  hasPendingOrganizationSwitch,
} from "@ingot/auth-core";

export default defineRequestInterceptor({
  name: "header",
  order: InterceptorOrder.request.header,
  async resolved(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    assertCurrentIdentity(config);
    const epoch = config.__ingotIdentityEpoch ?? usePermissions().contextEpoch;
    config.__ingotIdentityEpoch = epoch;
    if (epoch !== usePermissions().contextEpoch)
      throw new CanceledError("身份已变化，已取消旧请求", config);
    if (hasPendingLogout(getAdminRuntimeConfig().login.appId) && !config.permit && !(config.url ?? "").includes("/bff/auth/"))
      throw new CanceledError("注销结果待确认，已暂停业务请求", config);
    config.headers = config.headers || {};
    if (
      getAdminRuntimeConfig().login.entry === "tenant" &&
      !config.permit &&
      !(config.url ?? "").includes("/bff/auth/")
    ) {
      let version = config.__ingotContextVersion ?? currentSessionContext();
      if (!version) {
        const { confirmBrowserSession } = await import("@/auth/browserContext");
        version = (await confirmBrowserSession()).contextVersion;
      }
      if (!version) throw new CanceledError("尚未确认当前组织会话", config);
      if (hasPendingOrganizationSwitch())
        throw new CanceledError("正在切换组织，已暂停业务请求", config);
      config.__ingotContextVersion = version;
      config.headers[BFF_CONTEXT_HEADER] = version;
    }
    const appStore = useAppStore();
    if (appStore.app.login.fingerprintEnabled) {
      config.headers["In-Ca-Sig"] = await generateFingerprint().catch(() => "");
    }
    if (epoch !== usePermissions().contextEpoch)
      throw new CanceledError("身份已变化，已取消旧请求", config);
    return config;
  },
});
