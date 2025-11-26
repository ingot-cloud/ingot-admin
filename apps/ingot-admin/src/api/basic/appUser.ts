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

const PATH = "/api/pms/v1/platform/admin/appUser";
/**
 * 用户分页信息
 */
export function UserPageAPI(page: Page, condition?: AppUser): Promise<R<Page<AppUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<AppUser>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

/**
 * 用户简介信息
 * @param id 用户ID
 */
export function UserProfileAPI(id: string): Promise<R<UserProfileVO>> {
  return request.get<UserProfileVO>(`${PATH}/profile/${id}`);
}

/**
 * 创建用户
 * @param params 参数
 */
export function CreateUserAPI(params: AppUserCreateDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

/**
 * 更新用户信息
 * @param params 参数
 */
export function UpdateUserAPI(params: AppUser): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

/**
 * 删除用户
 */
export function RemoveUserAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}

/**
 * 用户组织信息
 */
export function UserOrgInfoAPI(id: string) {
  return request.get<Array<UserOrgInfoVO>>(`${PATH}/orgInfo/${id}`);
}

/**
 * 用户组织编辑
 */
export function UserOrgEditAPI(params: UserOrgEditDTO) {
  filterParams(params);
  return request.put<void>(`${PATH}/org`, params);
}

/**
 * 用户离开组织API
 */
export function UserOrgLeaveAPI(params: UserOrgEditDTO) {
  filterParams(params);
  return request.put<void>(`${PATH}/org/leave`, params);
}

/**
 * 用户重置密码
 */
export function UserResetPwdAPI(id: string) {
  return request.put<ResetPwdVO>(`${PATH}/resetPwd/${id}`);
}
