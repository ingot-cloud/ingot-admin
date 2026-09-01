import Http from "@/net";
import type { R, UserPasswordDTO } from "@/models";

export function InitPwdAPI(params: UserPasswordDTO): Promise<R<void>> {
  return Http.put<void>("/api/pms/v1/org/user/pwd/init", params, {
    crypto: {
      request: { mode: "whole" },
    },
  });
}

export function FixPasswordAPI(params: UserPasswordDTO): Promise<R<void>> {
  return Http.put<void>("/api/pms/v1/org/user/pwd", params, {
    crypto: {
      request: { mode: "whole" },
    },
  });
}
