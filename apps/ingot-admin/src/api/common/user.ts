import Http from "@/net";
import type { UserInfo, R } from "@/models";

/**
 * 获取用户信息
 */
export function UserInfoAPI(): Promise<R<UserInfo>> {
  return Http.get<UserInfo>("/api/pms/v1/org/user");
}
