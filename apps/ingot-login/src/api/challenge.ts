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

/**
 * 预授权
 */
export async function PreAuthorizeAPI({
  username,
  password,
  code,
}: {
  username: string;
  password: string;
  code?: string;
}): Promise<R<PreAuthorizeResult>> {
  const loginStore = useLoginStore();
  const pre_grant_type = loginStore.preGrantType;
  const afterEncrypt = await AES({
    data: { password },
    keys: ["password"],
  });
  // application/x-www-form-urlencoded
  const data = new URLSearchParams({
    username,
    password: afterEncrypt.password,
  });
  const parameter = toRaw(loginStore.requiredParameters);
  return Http.post<PreAuthorizeResult>("/api/auth/oauth2/pre_authorize", data, {
    params: {
      user_type: "0",
      _vc_code: code,
      pre_grant_type,
      ...parameter,
    },
  });
}

/**
 * 授权认证
 */
export function AuthorizeAPI(tenant: string): Promise<R<AuthorizaResult>> {
  const loginStore = useLoginStore();
  const pre_grant_type = loginStore.preGrantType;
  const parameter = toRaw(loginStore.requiredParameters);
  return Http.get<AuthorizaResult>("/api/auth/oauth2/authorize", null, {
    params: {
      org: tenant,
      pre_grant_type,
      ...parameter,
    },
  });
}
