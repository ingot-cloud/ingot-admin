import { CanceledError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { currentSessionContext } from "@ingot/auth-core";
import { useAuthStore, usePermissions } from "@/stores/modules/auth";

const canRunDuringTransition = (config: AxiosRequestConfig): boolean =>
  config.permit === true ||
  (config.url ?? "").includes("/bff/auth/") ||
  (config.__ingotIdentityBootstrap === true && (config.method ?? "get").toLowerCase() === "get");

/** 公共Http调用时同步固定来源；重试不能覆盖已有纪元或组织版本。 */
export const captureRequestIdentity = (config: AxiosRequestConfig): void => {
  config.__ingotIdentityEpoch ??= usePermissions().contextEpoch;
  config.__ingotContextVersion ??= currentSessionContext();
  config.__ingotIdentityPaused ??= useAuthStore().switchingIdentity || useAuthStore().loggingOut;
};

/** 重试和异步准备完成后均须保留原身份，禁止向新会话发送旧请求。 */
export const assertCurrentIdentity = (config: InternalAxiosRequestConfig): void => {
  if (
    !canRunDuringTransition(config) &&
    (config.__ingotIdentityPaused || useAuthStore().switchingIdentity || useAuthStore().loggingOut)
  )
    throw new CanceledError("身份重验期间已暂停业务请求", config);
  if (
    config.__ingotIdentityEpoch !== undefined &&
    config.__ingotIdentityEpoch !== usePermissions().contextEpoch
  )
    throw new CanceledError("身份已变化，已取消旧请求", config);
};

/** CSRF、指纹与信封异步准备完成后，阻止旧身份请求发送到新会话。 */
export default defineRequestInterceptor({
  name: "identity",
  order: InterceptorOrder.request.envelope + 1,
  resolved(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    assertCurrentIdentity(config);
    return config;
  },
});
