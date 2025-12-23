import Http from "@/net";
import type { R, Page, UserTokenVO, UserTokenQueryDTO, UserRevokeDTO } from "@/models";
import { filterParams } from "@/utils/object";

export function UserTokensAPI(
  page: Page,
  condition?: UserTokenQueryDTO,
): Promise<R<Page<UserTokenVO[]>>> {
  if (condition) {
    filterParams(condition);
  }
  return Http.get<Page<UserTokenVO[]>>("/api/auth/token/tokens", {
    ...page,
    ...condition,
  });
}

export function RevokeTokenByJtiAPI(jti: string): Promise<R<void>> {
  return Http.delete<void>(`/api/auth/token/jti`, { payload: jti });
}

export function RevokeTokenByUserAPI(params: UserRevokeDTO): Promise<R<void>> {
  return Http.delete<void>(`/api/auth/token/user`, params);
}
