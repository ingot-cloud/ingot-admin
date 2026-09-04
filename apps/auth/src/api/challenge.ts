import request from "@/net";
import type { R, PreAuthorizeResult, AuthorizaResult } from "@/models";
import { useLoginStore } from "@/stores/modules/login";

/**
 * session 预授权
 */
export function SessionAuthorizeAPI(): Promise<R<PreAuthorizeResult>> {
  const loginStore = useLoginStore();
  const pre_grant_type = "session";
  const parameter = toRaw(loginStore.requiredParameters);
  return request.post<PreAuthorizeResult>("/api/auth/oauth2/pre_authorize", null, {
    params: {
      user_type: "0",
      pre_grant_type,
      ...parameter,
    },
    feedback: "silent",
  });
}

export async function LoginAPI({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<R<PreAuthorizeResult>> {
  return request.post<PreAuthorizeResult>(
    "/api/bff/auth/login",
    {
      username,
      password,
    },
    {
      crypto: {
        request: {
          mode: "whole",
        },
      },
    },
  );
}

/**
 * 授权认证
 */
export async function SelectTenantAPI(tenant: string): Promise<R<AuthorizaResult>> {
  const loginStore = useLoginStore();
  const parameter = toRaw(loginStore.requiredParameters);
  return request.post<AuthorizaResult>("/api/bff/auth/tenant/select", {
    tenantId: tenant,
    redirectUri: parameter.redirect_uri,
  });
}
