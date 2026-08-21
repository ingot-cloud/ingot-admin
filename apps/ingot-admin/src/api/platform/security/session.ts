import request from "@/net";
import type {
  R,
  Page,
  PlatformSessionVO,
  PlatformSessionQueryDTO,
  PlatformUserSessionRevokeDTO,
} from "@/models";
import { filterParams } from "@/utils/object";

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
