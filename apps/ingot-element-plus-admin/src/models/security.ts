export interface UserToken {
  accessToken?: string;
  tokenType?: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  org?: string;
}

export interface TenantItem {
  id?: string;
  name?: string;
  avatar?: string;
  main?: string;
}

export interface PreAuthorizeResult {
  allows?: Array<TenantItem>;
  code?: string;
}

export interface User {
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  initPwd?: boolean;
}

export interface UserInfo {
  user?: User;
  roles: Array<string>;
  allows: Array<TenantItem>;
}

export interface UserPasswordDTO {
  password?: string;
  newPassword?: string;
}
