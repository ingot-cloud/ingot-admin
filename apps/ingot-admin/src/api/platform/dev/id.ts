import request from "@/net";
import type { R, Page, BizLeafAlloc } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/dev/id";

/**
 * 获取分页信息
 * @returns
 */
export function IdPageAPI(page: Page, condition?: BizLeafAlloc): Promise<R<Page<BizLeafAlloc>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<BizLeafAlloc>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

export function CreateIdAPI(params: BizLeafAlloc): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateIdAPI(params: BizLeafAlloc): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveIdAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
