import type { ApiError } from "@ingot/http-client";
import { StatusCode } from "@/net/status-code";

/** HTTP 401 或未授权业务码，均视为需要跳转登录。 */
export const isAdminUnauthorized = (error: ApiError): boolean =>
  error.status === 401 || error.code === StatusCode.UNAUTHORIZED || error.code === StatusCode.TokenInvalid;
