import request from "@/net";
import type { R, MetaApp, Page } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/meta/app";

export function GetAppPageAPI(page: Page, filter?: MetaApp): Promise<R<Page<MetaApp>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Page<MetaApp>>(`${PATH}/page`, {
    ...page,
    ...filter,
  });
}

export function CreateAppAPI(params: MetaApp): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateAppAPI(params: MetaApp): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveAppAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
