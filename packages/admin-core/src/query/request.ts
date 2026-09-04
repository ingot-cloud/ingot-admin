import type { RequestOptions } from "@ingot/http-client";

/**
 * Query / Mutation 默认请求选项：由 QueryCache 最终提示，不计入 NProgress。
 */
export const silentQueryRequest = (signal?: AbortSignal): RequestOptions => ({
  signal,
  feedback: "silent",
  progress: "silent",
});
