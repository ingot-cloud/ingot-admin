import request from "@/net";
import type { R, PlatformApp, Page } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/base/app";

export function GetAppPageAPI(page: Page, filter?: PlatformApp): Promise<R<Page<PlatformApp>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Page<PlatformApp>>(`${PATH}/page`, {
    ...page,
    ...filter,
  });
}

export function CreateAppAPI(params: PlatformApp): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateAppAPI(params: PlatformApp): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveAppAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
