import request from "@/net";
import type { R, Page, BizLeafAlloc } from "@/models";
import { filterParams } from "@/utils/object";

/**
 * 获取分页信息
 * @returns
 */
export function IdPageAPI(page: Page, condition?: BizLeafAlloc): Promise<R<Page<BizLeafAlloc>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<BizLeafAlloc>>("/api/pms/v1/admin/id/page", {
    ...page,
    ...condition,
  });
}

export function CreateIdAPI(params: BizLeafAlloc): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/admin/id", params);
}

export function UpdateIdAPI(params: BizLeafAlloc): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/id", params);
}

export function RemoveIdAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/id/${id}`);
}
