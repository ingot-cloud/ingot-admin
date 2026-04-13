import Http from "@/net";
import type { R, PreAuthorizeResult, AuthorizaResult } from "@/models";
import { AES } from "@/utils/encrypt";
import { useLoginStore } from "@/stores/modules/login";

/**
 * session 预授权
 */
export function SessionAuthorizeAPI(): Promise<R<PreAuthorizeResult>> {
  const loginStore = useLoginStore();
  const pre_grant_type = "session";
  const parameter = toRaw(loginStore.requiredParameters);
  return Http.post<PreAuthorizeResult>("/api/auth/oauth2/pre_authorize", null, {
    params: {
      user_type: "0",
      pre_grant_type,
      ...parameter,
    },
    manualProcessingFailure: true,
  });
}

export async function LoginAPI({
  username,
  password,
  code,
}: {
  username: string;
  password: string;
  code?: string;
}): Promise<R<PreAuthorizeResult>> {
  const afterEncrypt = await AES({
    data: { username, password },
    keys: ["username", "password"],
  });

  const data = {
    username: afterEncrypt.username,
    password: afterEncrypt.password,
  }

  return Http.post<PreAuthorizeResult>("/api/bff/auth/login", data, {
    params: {
      _vc_code: code,
    },
  });
}

/**
 * 授权认证
 */
export async function SelectTenantAPI(tenant: string): Promise<R<AuthorizaResult>> {
  const loginStore = useLoginStore();
  const parameter = toRaw(loginStore.requiredParameters);
  return Http.post<AuthorizaResult>("/api/bff/auth/tenant/select", {
    tenantId: tenant,
    redirectUri: parameter.redirect_uri,
  });
}
