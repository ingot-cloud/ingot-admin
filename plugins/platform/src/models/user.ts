import type { OptionIDEntity } from "@ingot/admin-core";
import type { SysUserTenant } from "./tenant";

export interface AllOrgUserFilterDTO {
  nickname?: string;
  phone?: string;
  email?: string;
}

export interface SysUser extends OptionIDEntity {
  id?: string;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  enabled?: boolean;
  locked?: boolean;
}

export interface UserDTO {
  id?: string;
  username?: string;
  phone?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

export interface UserProfileVO {
  orgList?: Array<SysUserTenant>;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  enabled?: boolean;
  locked?: boolean;
  createdAt: string;
}

export interface ResetPwdVO {
  random?: string;
}

export interface UserOrgEditDTO {
  id?: string;
  orgId?: string;
  deptIds?: Array<string>;
  roleIds?: Array<string>;
}

export interface UserOrgInfoVO {
  orgId?: string;
  deptIds?: Array<string>;
  roleIds?: Array<string>;
}

export interface SimpleUserVO {
  id?: string;
  nickname?: string;
  avatar?: string;
}

export interface SimpleUserWithPhoneVO extends SimpleUserVO {
  phone?: string;
}
