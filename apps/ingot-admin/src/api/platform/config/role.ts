import request from "@/net";
import type { RoleTreeNodeVO, PlatformRole, SetDTO, R, PermissionTreeNode, Option } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/config/role";

export function RoleOptionsAPI() {
  return request.get<Array<Option<string>>>(`${PATH}/options`);
}

export function RoleListAPI(condition?: PlatformRole): Promise<R<Array<RoleTreeNodeVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<RoleTreeNodeVO>>(`${PATH}/list`, {
    ...condition,
  });
}

export function CreateRoleAPI(params: PlatformRole): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateRoleAPI(params: PlatformRole): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function DeleteRoleAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}

export function BindAuthorityAPI(params: SetDTO): Promise<R<void>> {
  return request.put<void>(`${PATH}/${params.id}/permissions`, params);
}

export function GetBindAuthoritiesAPI(id: string): Promise<R<Array<PermissionTreeNode>>> {
  return request.get<Array<PermissionTreeNode>>(`${PATH}/${id}/permissions`);
}
