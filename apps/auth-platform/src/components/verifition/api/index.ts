/**
 * 验证码拉码 / 验码。URL 与 Header 名由 412 data 动态传入，禁止写死。
 */

import request from "@/net";

export function reqGet(url: string, data: Record<string, unknown>) {
  return request.get<Record<string, unknown>>(url, data, {
    skipChallenge: true,
    permit: true,
  });
}

export function reqCheck(
  url: string,
  data: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return request.post<Record<string, unknown>>(url, null, {
    params: data,
    headers,
    skipChallenge: true,
    permit: true,
    feedback: "silent",
  });
}
