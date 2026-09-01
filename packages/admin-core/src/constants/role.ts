/**
 * 系统管理员编码
 */
export const ROLE_SYSTEM_ADMIN_CODE = "role_admin";

/**
 * 管理员编码
 */
export const ROLE_MANAGER_CODE = "role_org_admin";

/**
 * 是否为管理员角色
 * @param code 角色编码
 * @returns boolean
 */
export function isRoleManager(code: string) {
  return ROLE_MANAGER_CODE == code;
}

/**
 * 是否为系统管理员角色
 * @param code 角色编码
 * @returns boolean
 */
export function isRoleSystemAdmin(code: string) {
  return ROLE_SYSTEM_ADMIN_CODE == code;
}
