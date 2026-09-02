import type { MemberRole } from "./role";

export interface MemberUser {
  id?: string;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  enabled?: boolean;
  locked?: boolean;
}

export interface MemberUserDTO {
  id?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface MemberUserProfileVO extends MemberUser {
  roles?: Array<MemberRole>;
}

export interface MemberUserBaseInfoDTO {
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface ResetPwdVO {
  random?: string;
}
