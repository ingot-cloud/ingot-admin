export interface OnlineToken {
  jti?: string;
  userId?: string;
  tenantId?: string;
  principalName?: string;
  clientId?: string;
  authType?: string;
  userType?: string;
  authorities?: string[];
  attributes?: Record<string, any>;
  issuedAt?: string;
  expiresAt?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  os?: string;
  browser?: string;
  location?: string;
}

export interface UserTokenVO {
  userId?: string;
  nickname?: string;
  avatar?: string;
  clientName?: string;
  tenantName?: string;
  tenantLogo?: string;
  tokens?: OnlineToken[];
}

export interface UserTokenQueryDTO {
  tenantId?: string;
  clientId?: string;
}

export interface UserRevokeDTO {
  userId?: string;
  clientId?: string;
  tenantId?: string;
}
