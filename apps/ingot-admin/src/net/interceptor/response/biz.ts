import type {
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import type { PostFilter } from "@/net/types";
import type { R } from "@/models/net";

import { Message, Confirm } from "@/utils/message";
import { StatusCode } from "@/net/status-code";
import { logoutAndReload } from "@/utils/security";
import { isString } from "@/utils";

/**
 * 未知响应实体
 */
const UnknownResponse: R = {
  code: StatusCode.Unknown,
  message: "网络异常，请稍后重试",
  data: {},
  status: Number(StatusCode.Unknown),
  statusText: "网络异常，请稍后重试",
  headers: {},
  config: {} as InternalAxiosRequestConfig,
};

const axiosResponseToR = (response?: AxiosResponse<R>): R => {
  if (!response || !response.data) {
    return UnknownResponse;
  }
  const result = Object.assign({}, response, {
    data: response.data.data,
    message: response.data.message,
    code: response.data.code,
  });
  return result;
};

/**
 * 业务失败公共处理器
 * @param config
 * @param response
 */
const bizResponseFailureHandler = (
  config: AxiosRequestConfig,
  response = UnknownResponse,
): Promise<R> => {
  // 如果手动处理，则直接返回
  if (config.manualProcessingFailure) {
    return Promise.reject(response);
  }

  const code = response.code;
  switch (code) {
    case StatusCode.TokenInvalid:
      if (config.refreshTokenAndRetry) {
        return Promise.reject(response);
      }

      console.log("pkce token失效不进行refresh，直接重新登录");
      // pkce token失效不进行refresh，直接重新登录
      logoutAndReload(true);
      break;
    // return new Promise((resolve) => {
    //   useAuthStore()
    //     .refreshToken()
    //     .then((userToken) => {
    //       // 刷新成功重试刚才的请求，替换token重新请求
    //       // 避免再次请求失败，刷新token后的重试不走失效逻辑
    //       const retryConfig = Object.assign({}, config);
    //       retryConfig.refreshTokenAndRetry = true;
    //       retryConfig.headers = retryConfig.headers || {};
    //       retryConfig.headers[
    //         "Authorization"
    //       ] = `${userToken.tokenType} ${userToken.accessToken}`;
    //       return Http.rawRequest(retryConfig);
    //     })
    //     .then((temp) => {
    //       resolve(temp);
    //     })
    //     .catch(() => {
    //       Message.warning("令牌失效", { showClose: true });
    //       // 刷新失败退出登录
    //       logoutAndReload();
    //     });
    // });
    case StatusCode.TokenSignBack:
      Confirm.warning("您已被签退，可以取消继续留在该页面，或者重新登录", {
        confirmButtonText: "重新登录",
        cancelButtonText: "取消",
      }).then(() => {
        logoutAndReload();
      });
      break;
    default:
      Message.warning(response.message, { showClose: true });
      break;
  }
  return Promise.reject(response);
};

class BizInterceptor implements PostFilter {
  order(): number {
    return 10;
  }

  resolved(response: AxiosResponse<R>): AxiosResponse<R> | Promise<AxiosResponse<R>> {
    const data = response.data;
    if (data.code === StatusCode.OK) {
      return Promise.resolve(axiosResponseToR(response));
    }
    return bizResponseFailureHandler(response.config, axiosResponseToR(response));
  }

  rejected(error: AxiosError<R>): Promise<R> {
    // 异常响应，并且响应结果为String那么退出登录
    if (error.code === "ERR_BAD_RESPONSE" && error.response && isString(error.response.data)) {
      logoutAndReload(true);
    }
    return bizResponseFailureHandler(error.config || {}, axiosResponseToR(error.response));
  }
}

export default new BizInterceptor();
