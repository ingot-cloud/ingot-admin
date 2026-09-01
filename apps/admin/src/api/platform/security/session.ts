import { Http as request } from "@ingot/admin-core";
import type {
  R,
  Page,
  PlatformSessionVO,
  PlatformSessionQueryDTO,
  PlatformUserSessionRevokeDTO,
} from "@base/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/security/platform/security/sessions";

export function SessionPageAPI(
  page: Page,
  condition?: PlatformSessionQueryDTO,
): Promise<R<Page<PlatformSessionVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<PlatformSessionVO>>(PATH, {
    ...page,
    ...condition,
  });
}

export function GetSessionAPI(sid: string): Promise<R<PlatformSessionVO | null>> {
  return request.get<PlatformSessionVO | null>(`${PATH}/${sid}`);
}

export function RevokeSessionBySidAPI(sid: string): Promise<R<boolean>> {
  return request.delete<boolean>(`${PATH}/${sid}`);
}

export function RevokeSessionsByUserAPI(params: PlatformUserSessionRevokeDTO): Promise<R<number>> {
  filterParams(params);
  return request.delete<number>(`${PATH}/user`, null, { params });
}
