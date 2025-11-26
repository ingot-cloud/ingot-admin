import request from "@/net";
import type {
  RolePageItemVO,
  AppRoleGroup,
  RoleGroupItemVO,
  AppRole,
  RoleFilterDTO,
  R,
  Option,
} from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/admin/appRole";
export function RoleOrgOptionsAPI(orgId: string) {
  return request.get<Array<Option<string>>>(`${PATH}/options/${orgId}`);
}

export function RoleGroupListAPI(filter?: RoleFilterDTO): Promise<R<Array<RoleGroupItemVO>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<RoleGroupItemVO>>(`${PATH}/group/list`, {
    ...filter,
  });
}

export function RoleListAPI(condition?: AppRole): Promise<R<Array<RolePageItemVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<RolePageItemVO>>(`${PATH}/list`, {
    ...condition,
  });
}

export function CreateRoleAPI(params: AppRole): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function UpdateRoleAPI(params: AppRole): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function RemoveRoleAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}

export function CreateRoleGroupAPI(params: AppRoleGroup): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}/group`, params);
}

export function UpdateRoleGroupAPI(params: AppRoleGroup): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/group`, params);
}

export function RemoveRoleGroupAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/group/${id}`);
}

export function GroupSortAPI(ids: Array<string>): Promise<R<void>> {
  return request.put<void>(`${PATH}/group/sort`, {
    ids,
  });
}
