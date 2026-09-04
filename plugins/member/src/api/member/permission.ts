import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/member/v1/platform/member/permission";

export function GetAuthorityTreeAPI(
  filter?: MemberPermission,
  options?: RequestOptions,
): Promise<R<Array<MemberPermissionTreeNodeVO>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<MemberPermissionTreeNodeVO>>(`${PATH}/tree`, filter, options);
}

export function CreateAuthorityAPI(
  params: MemberPermission,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params, options);
}

export function UpdateAuthorityAPI(
  params: MemberPermission,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function RemoveAuthorityAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}
