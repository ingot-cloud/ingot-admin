import { CanceledError, type AxiosError, type AxiosResponse, type AxiosRequestConfig } from "axios";
import { defineResponseInterceptor, InterceptorOrder } from "@ingot/http-client";
import { usePermissions } from "@/stores/modules/auth";

const isStale = (config?: AxiosRequestConfig): boolean =>
  config?.__ingotIdentityEpoch !== undefined &&
  config.__ingotIdentityEpoch !== usePermissions().contextEpoch;

/** 在业务码处理和401跳转之前丢弃旧身份响应，仍先完成信封解密清理。 */
export default defineResponseInterceptor({
  name: "identity",
  order: InterceptorOrder.response.envelope + 1,
  resolved(response: AxiosResponse): AxiosResponse {
    if (isStale(response.config))
      throw new CanceledError("身份已变化，已忽略旧响应", response.config);
    return response;
  },
  rejected(error: AxiosError): Promise<never> {
    return Promise.reject(
      isStale(error.config) ? new CanceledError("身份已变化，已忽略旧响应", error.config) : error,
    );
  },
});
