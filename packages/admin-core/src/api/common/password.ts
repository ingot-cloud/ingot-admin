import { request, type RequestOptions } from "@/net";
import type { R } from "@/models";
import type { CurrentPasswordInput, PasswordChangeState } from "@/models/iam";

const PATH = "/api/iam/v1/me/password";

export function PasswordChangeStateAPI(options?: RequestOptions): Promise<R<PasswordChangeState>> {
  return request.get<PasswordChangeState>(PATH, undefined, options);
}

const cryptoOptions = {
  crypto: {
    request: { mode: "whole" as const },
  },
};

export function InitPwdAPI(params: CurrentPasswordInput): Promise<R<void>> {
  return request.put<void>(PATH, params, cryptoOptions);
}

export function FixPasswordAPI(params: CurrentPasswordInput): Promise<R<void>> {
  return request.put<void>(PATH, params, cryptoOptions);
}
