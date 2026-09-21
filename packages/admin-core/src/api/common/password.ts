import { request } from "@/net";
import type { R } from "@/models";
import type { CurrentPasswordInput } from "@/models/iam";

const PATH = "/api/iam/v1/me/password";

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
