import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, Page, BizLeafAlloc } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/dev/id";

export function IdPageAPI(
  page: Page,
  condition?: BizLeafAlloc,
  options?: RequestOptions,
): Promise<R<Page<BizLeafAlloc>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<BizLeafAlloc>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

export function CreateIdAPI(params: BizLeafAlloc, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params, options);
}

export function UpdateIdAPI(params: BizLeafAlloc, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function RemoveIdAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}
