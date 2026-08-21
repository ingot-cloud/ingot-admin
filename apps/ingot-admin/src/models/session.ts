export interface PlatformSessionVO {
  sid?: string;
  jti?: string;
  userId?: number | string;
  username?: string;
  nickname?: string;
  avatar?: string;
  tenantId?: number | string;
  tenantName?: string;
  clientId?: string;
  authType?: string;
  userType?: string;
  ipAddress?: string;
  location?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  issuedAt?: string;
  expiresAt?: string;
  lastAccessAt?: string;
}

export interface PlatformSessionQueryDTO {
  tenantId?: string;
  clientId?: string;
  userId?: string;
  ipAddress?: string;
}

export interface PlatformUserSessionRevokeDTO {
  tenantId?: number | string;
  userId?: number | string;
  clientId?: string;
}

export interface SessionConcurrencyPolicy {
  id?: number;
  scope?: string;
  clientId?: string;
  userType?: string;
  maxSessions?: number;
  dimension?: string;
  overflow?: string;
  adminForbidConcurrent?: boolean;
  enabled?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}
