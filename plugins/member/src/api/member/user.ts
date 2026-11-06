import { ImagePurpose, stageImageField } from "@ingot/admin-core";
import { request, type RequestOptions } from "@ingot/admin-core";
import type {
  MemberUser,
  Page,
  MemberUserDTO,
  MemberUserProfileVO,
  MemberRole,
  R,
  ResetPwdVO,
  SetDTO,
  AccountLockDTO,
} from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/member/v1/platform/member/user";

/**
 * 用户分页信息
 */
export function UserPageAPI(
  page: Page,
  condition?: MemberUserDTO,
  options?: RequestOptions,
): Promise<R<Page<MemberUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<MemberUser>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

/**
 * 用户简介信息
 * @param id 用户ID
 */
export function UserProfileAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<MemberUserProfileVO>> {
  return request.get<MemberUserProfileVO>(`${PATH}/detail/${id}`, undefined, options);
}

/**
 * 创建用户
 * @param params 参数
 */
export async function CreateUserAPI(params: MemberUserDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, await stageImageField(params, "avatar", ImagePurpose.APP_USER_CREATE));
}

/**
 * 更新用户信息
 * @param params 参数
 */
export async function UpdateUserAPI(params: MemberUserDTO): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, await stageImageField(params, "avatar", ImagePurpose.APP_USER_UPDATE, params.id));
}

/**
 * 删除用户
 */
export function RemoveUserAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}

/**
 * 用户重置密码
 */
export function UserResetPwdAPI(id: string) {
  return request.put<ResetPwdVO>(`${PATH}/${id}/reset-password`);
}

export function SetUserRoleAPI(params: SetDTO): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${params.id}/roles`, params);
}

export function GetUserRolesAPI(id: string, options?: RequestOptions): Promise<R<MemberRole[]>> {
  return request.get<MemberRole[]>(`${PATH}/${id}/roles`, undefined, options);
}

export function EnableAccountAPI(id: string, reason?: string) {
  return request.put<void>(`${PATH}/${id}/enable`, {
    reason,
  });
}

export function DisableAccountAPI(id: string, reason?: string) {
  return request.put<void>(`${PATH}/${id}/disable`, {
    reason,
  });
}

export function LockAccountAPI(id: string, payload: AccountLockDTO) {
  return request.put<void>(`${PATH}/${id}/lock`, {
    ...payload,
  });
}

export function UnlockAccountAPI(id: string, payload: AccountLockDTO) {
  return request.put<void>(`${PATH}/${id}/unlock`, {
    ...payload,
  });
}
