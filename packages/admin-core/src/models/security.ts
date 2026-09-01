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
}

export interface UserInfo {
  user?: User;
  roles: Array<string>;
  allows: Array<TenantItem>;
  mustChangePwd: boolean
}

export interface UserPasswordDTO {
  password?: string;
  newPassword?: string;
}
