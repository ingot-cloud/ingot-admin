import type { InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { CSRF_HEADER, type AuthEntry } from "./types";

const tokens = new Map<AuthEntry, { token: string; expiresAt: number }>();
/** 仅在当前进程按应用缓存，刷新后由同源幂等自举恢复，不读旧storage凭证。 */
export const rememberCsrfToken = (
  token: string,
  entry: AuthEntry = "tenant",
  expiresAt?: string,
): void => {
  tokens.set(entry, {
    token,
    expiresAt: expiresAt ? Date.parse(expiresAt) : Number.POSITIVE_INFINITY,
  });
};
export const currentCsrfToken = (entry: AuthEntry = "tenant"): string | undefined => {
  const value = tokens.get(entry);
  return value && value.expiresAt > Date.now() ? value.token : undefined;
};
export const clearCsrfToken = (entry?: AuthEntry): void => {
  if (entry) tokens.delete(entry);
  else tokens.clear();
};
export const isSameOriginAuthRequest = (url: string | undefined, baseURL?: string): boolean => {
  if (!url || typeof location === "undefined") return false;
  try {
    const target = new URL(url, baseURL ? new URL(baseURL, location.origin) : location.origin);
    return target.origin === location.origin && /^\/(?:api\/)?bff\/auth\//.test(target.pathname);
  } catch {
    return false;
  }
};
/** 只给本应用同源BFF写请求附带CSRF，不通过全局默认头泄露到其他URL。 */
export const createCsrfRequestInterceptor = (entry: () => AuthEntry = () => "tenant") =>
  defineRequestInterceptor({
    name: "bff-csrf",
    order: InterceptorOrder.request.header + 1,
    resolved(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
      const method = (config.method ?? "get").toLowerCase();
      if (
        !isSameOriginAuthRequest(config.url, config.baseURL) ||
        config.url?.endsWith("/csrf") ||
        method === "get" ||
        method === "head"
      )
        return config;
      const token = currentCsrfToken(entry());
      if (token) config.headers[CSRF_HEADER] = token;
      return config;
    },
  });
