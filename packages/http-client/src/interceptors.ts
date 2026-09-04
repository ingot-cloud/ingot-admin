import type { AxiosInstance } from "axios";
import type { PostFilter, PreFilter } from "./types";

export const installRequestInterceptors = (
  axios: AxiosInstance,
  interceptors: PreFilter[],
): void => {
  const ordered = [...interceptors].sort((a, b) => b.order() - a.order());
  ordered.forEach((interceptor) => {
    axios.interceptors.request.use(interceptor.resolved, interceptor.rejected, interceptor.options);
  });
};

export const installResponseInterceptors = (
  axios: AxiosInstance,
  interceptors: PostFilter[],
): void => {
  const ordered = [...interceptors].sort((a, b) => a.order() - b.order());
  ordered.forEach((interceptor) => {
    axios.interceptors.response.use(interceptor.resolved, interceptor.rejected);
  });
};
