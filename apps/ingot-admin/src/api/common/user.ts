import Http from "@/net";
import type { UserInfo, R, MenuTreeNode } from "@/models";

/**
 * 获取用户信息
 */
export function UserInfoAPI(): Promise<R<UserInfo>> {
  return Http.get<UserInfo>("/api/pms/v1/auth/user/info", null, {
    aesDecryptKeys: [
      { key: "initPwd", type: "boolean" },
      { key: "roles", type: "array" },
    ],
  });
}

/**
 * 获取用户信息
 */
export function UserMenuAPI(): Promise<R<Array<MenuTreeNode>>> {
  return Http.get<Array<MenuTreeNode>>("/api/pms/v1/auth/user/menus");
}
