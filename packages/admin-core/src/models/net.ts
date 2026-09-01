import type { AxiosResponse } from "axios";

/**
 * 响应模型
 */
export interface R<T = unknown> extends AxiosResponse<T> {
  // 响应码
  code: string;
  // 消息
  message: string;
  // 响应体
  data: T;
}
