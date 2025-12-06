import request from "@/net";
import type {
  MemberUser,
  Page,
  MemberUserDTO,
  MemberUserProfileVO,
  R,
  ResetPwdVO,
  SetDTO,
} from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/member/v1/platform/member/user";

/**
 * 用户分页信息
 */
export function UserPageAPI(page: Page, condition?: MemberUserDTO): Promise<R<Page<MemberUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<MemberUser>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

/**
 * 用户简介信息
 * @param id 用户ID
 */
export function UserProfileAPI(id: string): Promise<R<MemberUserProfileVO>> {
  return request.get<MemberUserProfileVO>(`${PATH}/detail/${id}`);
}

/**
 * 创建用户
 * @param params 参数
 */
export function CreateUserAPI(params: MemberUserDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

/**
 * 更新用户信息
 * @param params 参数
 */
export function UpdateUserAPI(params: MemberUserDTO): Promise<R<void>> {
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
 * 用户重置密码
 */
export function UserResetPwdAPI(id: string) {
  return request.put<ResetPwdVO>(`${PATH}/${id}/reset-password`);
}

export function SetUserRoleAPI(params: SetDTO): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${params.id}/roles`, params);
}
