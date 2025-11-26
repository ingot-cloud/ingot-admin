import request from "@/net";
import type { R, MetaAuthority, AuthorityTreeNode } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/meta/authority";

/**
 * 获取权限分页信息
 * @returns
 */
export function GetAuthorityTreeAPI(filter?: MetaAuthority): Promise<R<Array<AuthorityTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<AuthorityTreeNode>>(`${PATH}/tree`, filter);
}

export function CreateAuthorityAPI(params: MetaAuthority): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateAuthorityAPI(params: MetaAuthority): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveAuthorityAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
