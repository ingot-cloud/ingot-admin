import { request, type RequestOptions } from "@ingot/admin-core";
import type {
  BizRoleAssignUsersDTO,
  TenantRolePrivate,
  RoleTreeNodeVO,
  R,
  Option,
  BizPermissionTreeNodeVO,
  SetDTO,
} from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/org/role";

export function RoleOptionsAPI(options?: RequestOptions): Promise<R<Array<Option<string>>>> {
  return request.get<Array<Option<string>>>(`${PATH}/options`, undefined, options);
}

export function RoleTreeAPI(
  condition?: TenantRolePrivate,
  options?: RequestOptions,
): Promise<R<Array<RoleTreeNodeVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<RoleTreeNodeVO>>(
    `${PATH}/tree`,
    {
      ...condition,
    },
    options,
  );
}

export function CreateRoleAPI(params: TenantRolePrivate, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params, options);
}

export function UpdateRoleAPI(params: TenantRolePrivate, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function RemoveRoleAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}

export function RoleSortAPI(ids: Array<string>, options?: RequestOptions): Promise<R<void>> {
  return request.put<void>(
    `${PATH}/sort`,
    {
      ids,
    },
    options,
  );
}

export function BindUserAPI(
  params: BizRoleAssignUsersDTO,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.put<void>(`${PATH}/${params.id}/users`, params, options);
}

export function BindAuthorityAPI(params: SetDTO, options?: RequestOptions): Promise<R<void>> {
  return request.put<void>(`${PATH}/${params.id}/permissions`, params, options);
}

export function GetBindAuthoritiesAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<Array<BizPermissionTreeNodeVO>>> {
  return request.get<Array<BizPermissionTreeNodeVO>>(
    `${PATH}/${id}/permissions`,
    undefined,
    options,
  );
}
