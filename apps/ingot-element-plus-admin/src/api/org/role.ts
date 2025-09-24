import request from "@/net";
import type {
  RolePageItemVO,
  SysRoleGroup,
  SysRole,
  RoleFilterDTO,
  Page,
  R,
  RoleBindParams,
  Option,
} from "@/models";
import { filterParams } from "@/utils/object";

export function RoleOptionsAPI() {
  return request.get<Array<Option<string>>>("/api/pms/v1/org/role/options");
}

export function RoleGroupListAPI(filter?: RoleFilterDTO): Promise<R<Array<SysRoleGroup>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<SysRoleGroup>>("/api/pms/v1/org/role/group/list", {
    ...filter,
  });
}

export function RoleListAPI(condition?: SysRole): Promise<R<Array<RolePageItemVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<RolePageItemVO>>("/api/pms/v1/org/role/list", {
    ...condition,
  });
}

export function RolePageAPI(page: Page, condition?: SysRole): Promise<R<Page<RolePageItemVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<RolePageItemVO>>("/api/pms/v1/org/role/page", {
    ...page,
    ...condition,
  });
}

export function CreateRoleAPI(params: SysRole): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/org/role", params);
}

export function UpdateRoleAPI(params: SysRole): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/org/role", params);
}

export function RemoveRoleAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/org/role/${id}`);
}

export function CreateRoleGroupAPI(params: SysRoleGroup): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/org/role/group", params);
}

export function UpdateRoleGroupAPI(params: SysRoleGroup): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/org/role/group", params);
}

export function RemoveRoleGroupAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/org/role/group/${id}`);
}

export function GroupSortAPI(ids: Array<string>): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/org/role/group/sort", {
    ids,
  });
}

export function BindUserAPI(params: RoleBindParams): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/org/role/bindUser", params);
}
