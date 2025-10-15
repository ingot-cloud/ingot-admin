import request from "@/net";
import type {
  Page,
  R,
  AppUser,
  UserProfileVO,
  AppUserCreateDTO,
  UserOrgInfoVO,
  UserOrgEditDTO,
  ResetPwdVO,
} from "@/models";
import { filterParams } from "@/utils/object";

/**
 * 用户分页信息
 */
export function UserPageAPI(page: Page, condition?: AppUser): Promise<R<Page<AppUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<AppUser>>("/api/pms/v1/admin/appUser/page", {
    ...page,
    ...condition,
  });
}

/**
 * 用户简介信息
 * @param id 用户ID
 */
export function UserProfileAPI(id: string): Promise<R<UserProfileVO>> {
  return request.get<UserProfileVO>(`/api/pms/v1/admin/appUser/profile/${id}`);
}

/**
 * 创建用户
 * @param params 参数
 */
export function CreateUserAPI(params: AppUserCreateDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>("/api/pms/v1/admin/appUser", params);
}

/**
 * 更新用户信息
 * @param params 参数
 */
export function UpdateUserAPI(params: AppUser): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/appUser", params);
}

/**
 * 删除用户
 */
export function RemoveUserAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/appUser/${id}`);
}

/**
 * 用户组织信息
 */
export function UserOrgInfoAPI(id: string) {
  return request.get<Array<UserOrgInfoVO>>(`/api/pms/v1/admin/appUser/orgInfo/${id}`);
}

/**
 * 用户组织编辑
 */
export function UserOrgEditAPI(params: UserOrgEditDTO) {
  filterParams(params);
  return request.put<void>(`/api/pms/v1/admin/appUser/org`, params);
}

/**
 * 用户离开组织API
 */
export function UserOrgLeaveAPI(params: UserOrgEditDTO) {
  filterParams(params);
  return request.put<void>(`/api/pms/v1/admin/appUser/org/leave`, params);
}

/**
 * 用户重置密码
 */
export function UserResetPwdAPI(id: string) {
  return request.put<ResetPwdVO>(`/api/pms/v1/admin/appUser/resetPwd/${id}`);
}
