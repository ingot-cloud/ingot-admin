import request from "@/net";
import type { R, MetaPermission, PermissionTreeNode } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/meta/permission";

/**
 * 获取权限分页信息
 * @returns
 */
export function GetAuthorityTreeAPI(
  filter?: MetaPermission,
): Promise<R<Array<PermissionTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<PermissionTreeNode>>(`${PATH}/tree`, filter);
}

export function CreateAuthorityAPI(params: MetaPermission): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateAuthorityAPI(params: MetaPermission): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveAuthorityAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
