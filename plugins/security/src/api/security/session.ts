import { request } from "@ingot/admin-core";
import type { RequestOptions } from "@ingot/admin-core";
import type {
  R,
  Page,
  PlatformSessionVO,
  PlatformSessionQueryDTO,
  PlatformUserSessionRevokeDTO,
} from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/security/platform/security/sessions";

export function SessionPageAPI(
  page: Page,
  condition?: PlatformSessionQueryDTO,
  options?: RequestOptions,
): Promise<R<Page<PlatformSessionVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<PlatformSessionVO>>(
    PATH,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

export function GetSessionAPI(sid: string, options?: RequestOptions): Promise<R<PlatformSessionVO | null>> {
  return request.get<PlatformSessionVO | null>(`${PATH}/${sid}`, undefined, options);
}

export function RevokeSessionBySidAPI(sid: string, options?: RequestOptions): Promise<R<boolean>> {
  return request.delete<boolean>(`${PATH}/${sid}`, null, options);
}

export function RevokeSessionsByUserAPI(
  params: PlatformUserSessionRevokeDTO,
  options?: RequestOptions,
): Promise<R<number>> {
  filterParams(params);
  return request.delete<number>(`${PATH}/user`, null, { params, ...options });
}
