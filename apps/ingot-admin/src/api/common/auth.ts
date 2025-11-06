import Http from "@/net";
import type { UserToken, R } from "@/models";
import { useAppStore } from "@/stores/modules/app";
import { useLoginStore } from "@/stores/modules/login";
import { AES } from "@/utils/encrypt";
import { storeToRefs } from "pinia";

export async function AuthorizeCodeTokenAPI(code: string) {
  const loginStore = useLoginStore();
  const { app } = useAppStore();
  const grant_type = "authorization_code";

  const afterEncrypt = await AES({
    data: { client_id: app.login.clientId },
    keys: ["client_id"],
  });

  // post 请求参数使用form data，get请求参数使用params
  const data = new URLSearchParams({
    code,
    grant_type,
    code_verifier: loginStore.codeVerifier,
    client_id: afterEncrypt.client_id,
    redirect_uri: app.login.loginCallbackUri,
  });
  return Http.post<UserToken>("/api/auth/oauth2/token", data, {
    ignoreTenant: true,
    permit: true,
  });
}

/**
 * 刷新Token
 */
export function RefreshTokenAPI(refreshToken: string): Promise<R<UserToken>> {
  const data = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  return Http.post<UserToken>("/api/auth/oauth2/token", data, {
    headers: {
      Authorization: storeToRefs(useAppStore()).getBasicToken.value,
    },
    manualProcessingFailure: true,
  });
}

/**
 * 撤销Token
 */
export function RevokeTokenAPI(token: string): Promise<R> {
  return Http.delete<void>("/api/auth/token", null, {
    headers: {
      Authorization: token,
    },
    manualProcessingFailure: true,
  });
}
