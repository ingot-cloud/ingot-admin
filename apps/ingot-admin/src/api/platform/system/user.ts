import request from "@/net";
import type {
  SysUser,
  Page,
  AllOrgUserFilterDTO,
  UserDTO,
  UserProfileVO,
  R,
  UserOrgInfoVO,
  UserOrgEditDTO,
  ResetPwdVO,
  SimpleUserWithPhoneVO,
} from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/system/user";

/**
 * 根据手机号获取用户列表
 */
export function SearchByPhone(phone: string) {
  return request.get<Array<SimpleUserWithPhoneVO>>(`${PATH}/searchByPhone`, {
    phone,
  });
}

/**
 * 用户分页信息
 */
export function UserPageAPI(
  page: Page,
  condition?: AllOrgUserFilterDTO,
): Promise<R<Page<SysUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysUser>>(`${PATH}/page`, {
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
export function CreateUserAPI(params: UserDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

/**
 * 更新用户信息
 * @param params 参数
 */
export function UpdateUserAPI(params: UserDTO): Promise<R<void>> {
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
  return request.delete<void>(`${PATH}/org`, params);
}

/**
 * 用户重置密码
 */
export function UserResetPwdAPI(id: string) {
  return request.put<ResetPwdVO>(`${PATH}/${id}/reset-password`);
}
