import request from "@/net";
import type { R, MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/member/v1/platform/member/permission";

/**
 * 获取权限分页信息
 * @returns
 */
export function GetAuthorityTreeAPI(
  filter?: MemberPermission,
): Promise<R<Array<MemberPermissionTreeNodeVO>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<MemberPermissionTreeNodeVO>>(`${PATH}/tree`, filter);
}

export function CreateAuthorityAPI(params: MemberPermission): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateAuthorityAPI(params: MemberPermission): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveAuthorityAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
