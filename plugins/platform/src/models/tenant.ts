import type { CommonStatus } from "./enums";

export interface SysTenant {
  id?: string;
  name?: string;
  code?: string;
  avatar?: string;
  orgType?: string;
  planId?: string;
  status?: CommonStatus;
  endAt?: string;
  createdAt?: string;
}

export interface SysUserTenant {
  id?: string;
  userId?: string;
  tenantId?: string;
  main?: boolean;
  name?: string;
  avatar?: string;
  createdAt?: string;
}

export interface CreateOrgDTO {
  avatar?: string;
  name?: string;
  nickname?: string;
  phone?: string;
}
