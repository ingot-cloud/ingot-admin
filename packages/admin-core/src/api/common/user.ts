import { request } from "@/net";
import type { UserInfo, UserEffectivePermissionVO, R, MenuTreeNode } from "@/models";

/**
 * 获取当前登录用户资料（不含业务权限码）
 */
export function UserInfoAPI(): Promise<R<UserInfo>> {
  return request.get<UserInfo>("/api/pms/v1/auth/user/info", null, {
    crypto: {
      response: {
        mode: "field",
        fields: [
          {
            key: "mustChangePwd",
            type: "boolean",
          },
          {
            key: "roles",
            type: "array",
          },
        ],
      },
    },
  });
}

/**
 * 获取当前用户可见导航树（不含按钮节点）
 */
export function UserMenuAPI(): Promise<R<Array<MenuTreeNode>>> {
  return request.get<Array<MenuTreeNode>>("/api/pms/v1/auth/user/menus");
}

/**
 * 获取当前用户已展开的具体权限码
 */
export function UserPermissionsAPI(): Promise<R<UserEffectivePermissionVO>> {
  return request.get<UserEffectivePermissionVO>("/api/pms/v1/auth/user/permissions");
}
