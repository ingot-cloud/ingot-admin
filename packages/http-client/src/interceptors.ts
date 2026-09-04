import type { AxiosError, AxiosInstance } from "axios";
import type { PostFilter, PreFilter } from "./types";

const rejectError = (error: AxiosError): Promise<unknown> => Promise.reject(error);

export function defineRequestInterceptor(interceptor: PreFilter): PreFilter {
  return {
    ...interceptor,
    rejected: interceptor.rejected ?? rejectError,
  };
}

export function defineResponseInterceptor(interceptor: PostFilter): PostFilter {
  return {
    ...interceptor,
    rejected: interceptor.rejected ?? rejectError,
  };
}

/** 按 order 降序注册，抵消 Axios 请求拦截器 LIFO，使越小越先执行。 */
export const installRequestInterceptors = (
  axios: AxiosInstance,
  interceptors: PreFilter[],
): void => {
  const ordered = interceptors
    .map((interceptor, index) => ({ interceptor, index }))
    .sort((left, right) => {
      if (right.interceptor.order !== left.interceptor.order) {
        return right.interceptor.order - left.interceptor.order;
      }
      // 同 order 后注册的先执行（Axios LIFO），反转下标使先传入的先跑
      return right.index - left.index;
    })
    .map(({ interceptor }) => interceptor);
  ordered.forEach((interceptor) => {
    axios.interceptors.request.use(
      interceptor.resolved,
      interceptor.rejected ?? rejectError,
      interceptor.options,
    );
  });
};

/** 按 order 升序注册；Axios 响应拦截器 FIFO，同样越小越先执行。 */
export const installResponseInterceptors = (
  axios: AxiosInstance,
  interceptors: PostFilter[],
): void => {
  const ordered = interceptors
    .map((interceptor, index) => ({ interceptor, index }))
    .sort((left, right) => {
      if (left.interceptor.order !== right.interceptor.order) {
        return left.interceptor.order - right.interceptor.order;
      }
      return left.index - right.index;
    })
    .map(({ interceptor }) => interceptor);
  ordered.forEach((interceptor) => {
    axios.interceptors.response.use(interceptor.resolved, interceptor.rejected ?? rejectError);
  });
};
