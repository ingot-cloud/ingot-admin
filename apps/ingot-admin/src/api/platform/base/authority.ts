import request from "@/net";
import type { R, PlatformPermission, PermissionTreeNode } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/base/permission";

/**
 * 获取权限分页信息
 * @returns
 */
export function GetAuthorityTreeAPI(
  filter?: PlatformPermission,
): Promise<R<Array<PermissionTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<PermissionTreeNode>>(`${PATH}/tree`, filter);
}

export function CreateAuthorityAPI(params: PlatformPermission): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateAuthorityAPI(params: PlatformPermission): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveAuthorityAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
