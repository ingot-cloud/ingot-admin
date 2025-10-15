import request from "@/net";
import type {
  RolePageItemVO,
  SysRoleGroup,
  RoleGroupItemVO,
  SysRole,
  RoleFilterDTO,
  R,
  RoleBindParams,
  AuthorityFilterDTO,
  AuthorityTreeNode,
  Option,
} from "@/models";
import { filterParams } from "@/utils/object";

export function RoleOrgOptionsAPI(orgId: string) {
  return request.get<Array<Option<string>>>(`/api/pms/v1/admin/role/options/${orgId}`);
}

export function RoleOptionsAPI() {
  return request.get<Array<Option<string>>>("/api/pms/v1/admin/role/options");
}

export function RoleGroupListAPI(filter?: RoleFilterDTO): Promise<R<Array<RoleGroupItemVO>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<RoleGroupItemVO>>("/api/pms/v1/admin/role/group/list", {
    ...filter,
  });
}

export function RoleListAPI(condition?: SysRole): Promise<R<Array<RolePageItemVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<RolePageItemVO>>("/api/pms/v1/admin/role/list", {
    ...condition,
  });
}

export function CreateRoleAPI(params: SysRole): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/admin/role", params);
}

export function UpdateRoleAPI(params: SysRole): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/role", params);
}

export function RemoveRoleAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/role/${id}`);
}

export function CreateRoleGroupAPI(params: SysRoleGroup): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/admin/role/group", params);
}

export function UpdateRoleGroupAPI(params: SysRoleGroup): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/role/group", params);
}

export function RemoveRoleGroupAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/role/group/${id}`);
}

export function GroupSortAPI(ids: Array<string>): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/admin/role/group/sort", {
    ids,
  });
}

export function BindAuthorityAPI(params: RoleBindParams): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/admin/role/bindAuthority", params);
}

export function OrgRoleBindDefaultAuthoritiesAPI(params: RoleBindParams): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/admin/role/orgRoleBindDefaultAuthority", params);
}

export function GetBindAuthoritiesAPI(
  id: string,
  isBind: boolean,
  condition?: AuthorityFilterDTO,
): Promise<R<Array<AuthorityTreeNode>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<AuthorityTreeNode>>(`/api/pms/v1/admin/role/bindAuthority/${id}`, {
    isBind,
    ...condition,
  });
}
