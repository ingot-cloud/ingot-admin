import { request, type RequestOptions } from "@ingot/admin-core";
import type {
  UserPageItemVO,
  Page,
  UserDTO,
  UserQueryDTO,
  OrgUserProfileVO,
  R,
  UserPageItemWithBindRoleStatusVO,
} from "@/models";
import { filterParams } from "@ingot/admin-core";

export function UserPageAPI(
  page: Page,
  condition?: UserQueryDTO,
  options?: RequestOptions,
): Promise<R<Page<UserPageItemVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<UserPageItemVO>>(
    "/api/pms/v1/org/user/page",
    {
      ...page,
      ...condition,
    },
    options,
  );
}

export function UserPageWithBindRoleStatusAPI(
  page: Page,
  condition?: UserQueryDTO,
  options?: RequestOptions,
): Promise<R<Page<UserPageItemWithBindRoleStatusVO>>> {
  const roleId = condition?.roleId;
  const query = condition ? { ...condition } : undefined;
  if (query) {
    filterParams(query);
    delete query.roleId;
  }
  return request.get<Page<UserPageItemWithBindRoleStatusVO>>(
    `/api/pms/v1/org/user/role/${roleId}/page`,
    {
      ...page,
      ...query,
    },
    options,
  );
}

export function UserProfileAPI(id: string, options?: RequestOptions): Promise<R<OrgUserProfileVO>> {
  return request.get<OrgUserProfileVO>(`/api/pms/v1/org/user/detail/${id}`, undefined, options);
}

export function CreateUserAPI(params: UserDTO, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/org/user", params, options);
}

export function UpdateUserAPI(params: UserDTO, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/org/user", params, options);
}

export function RemoveUserAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/org/user/${id}`, null, options);
}
