import type { CommonStatus } from "./enums";

export interface UserPageItemVO {
  userId: string;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: CommonStatus;
  enabled?: boolean;
  locked?: boolean;
  createdAt: string;
}

export interface UserPageItemWithBindRoleStatusVO extends UserPageItemVO {
  canBind?: boolean;
}

export interface UserDTO {
  id?: string;
  username?: string;
  phone?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

export interface OrgUserProfileVO {
  deptIds: Array<string>;
  roleIds?: Array<string>;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  enabled?: boolean;
  locked?: boolean;
  createdAt: string;
}

export interface UserQueryDTO {
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  roleId?: string;
  deptId?: string;
}

export interface SimpleUserVO {
  id?: string;
  nickname?: string;
  avatar?: string;
}
