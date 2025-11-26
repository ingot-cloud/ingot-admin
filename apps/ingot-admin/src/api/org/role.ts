import request from "@/net";
import type {
  BizRoleAssignUsersDTO,
  TenantRolePrivate,
  RoleTreeNodeVO,
  R,
  Option,
  BizAuthorityTreeNodeVO,
  SetDTO,
} from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/org/role";

export function RoleOptionsAPI() {
  return request.get<Array<Option<string>>>(`${PATH}/options`);
}

export function RoleTreeAPI(condition?: TenantRolePrivate): Promise<R<Array<RoleTreeNodeVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<RoleTreeNodeVO>>(`${PATH}/tree`, {
    ...condition,
  });
}

export function CreateRoleAPI(params: TenantRolePrivate): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateRoleAPI(params: TenantRolePrivate): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveRoleAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}

export function RoleSortAPI(ids: Array<string>): Promise<R<void>> {
  return request.put<void>(`${PATH}/sort`, {
    ids,
  });
}

export function BindUserAPI(params: BizRoleAssignUsersDTO): Promise<R<void>> {
  return request.put<void>(`${PATH}/${params.id}/users`, params);
}

export function BindAuthorityAPI(params: SetDTO): Promise<R<void>> {
  return request.put<void>(`${PATH}/${params.id}/authorities`, params);
}

export function GetBindAuthoritiesAPI(id: string): Promise<R<Array<BizAuthorityTreeNodeVO>>> {
  return request.get<Array<BizAuthorityTreeNodeVO>>(`${PATH}/${id}/authorities`);
}
