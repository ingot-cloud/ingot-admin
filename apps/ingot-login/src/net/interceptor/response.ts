import type {
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { Message } from "@/utils/message";
import type { R } from "@/models";
import { StatusCode } from "@/net/status-code";

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
      return new Promise((resolve) => {});
    case StatusCode.TokenSignBack:
      break;
    default:
      Message.warning(response.message, { showClose: true });
      break;
  }
  return Promise.reject(response);
};

/**
 * 响应完成拦截器
 * @param response
 */
export const onResponseFulfilled = (response: AxiosResponse<R>): Promise<R> => {
  const data = response.data;
  if (data.code === StatusCode.OK) {
    return Promise.resolve(axiosResponseToR(response));
  }
  return bizResponseFailureHandler(response.config, axiosResponseToR(response));
};

/**
 * 响应拒绝拦截器
 * @param error
 */
export const onResponseRejected = (error: AxiosError<R>): Promise<R> => {
  return bizResponseFailureHandler(error.config || {}, axiosResponseToR(error.response));
};
