import { CanceledError, type InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { usePermissions } from "@/stores/modules/auth";

/** 重试和异步准备完成后均须保留原身份，禁止向新会话发送旧请求。 */
export const assertCurrentIdentity = (config: InternalAxiosRequestConfig): void => {
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
