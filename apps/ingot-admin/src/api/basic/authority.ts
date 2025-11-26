import request from "@/net";
import type { R, MetaAuthority, AuthorityTreeNode, AuthorityFilterDTO } from "@/models";
import { filterParams } from "@/utils/object";

/**
 * 获取权限分页信息
 * @returns
 */
export function GetAuthorityTreeAPI(
  filter?: AuthorityFilterDTO,
): Promise<R<Array<AuthorityTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<AuthorityTreeNode>>("/api/pms/v1/admin/authority/tree", filter);
}

/**
 * 创建权限
 * @param params 参数
 * @returns
 */
export function CreateAuthorityAPI(params: MetaAuthority): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/admin/authority", params);
}

/**
 * 更新权限
 * @param params 参数
 * @returns
 */
export function UpdateAuthorityAPI(params: MetaAuthority): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/authority", params);
}

/**
 * 删除权限
 * @param id id
 * @returns
 */
export function RemoveAuthorityAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/authority/${id}`);
}
