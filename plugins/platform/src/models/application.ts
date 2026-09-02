import type { CommonStatus } from "./enums";

export interface ApplicationFilterDTO {
  appName?: string;
}

export interface PlatformApp {
  id?: string;
  code?: string;
  name?: string;
  appType?: string;
  icon?: string;
  intro?: string;
  sort?: number;
  status?: CommonStatus | string;
  menuId?: string;
  permissionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformAppFilterDTO {
  appType?: string;
  status?: string;
  name?: string;
}

export interface PlatformAppDetailVO extends PlatformApp {
  rootPermissionId?: string;
  rootPermissionCode?: string;
  menuCount?: number;
  permissionCount?: number;
}

export interface PlatformAppCreateDTO {
  code?: string;
  name?: string;
  appType?: string;
  icon?: string;
  intro?: string;
  sort?: number;
}

export interface PlatformAppUpdateDTO {
  name?: string;
  icon?: string;
  intro?: string;
  sort?: number;
}

export interface AppEnabledDTO {
  id: string;
  enabled: boolean;
}

export interface PlatformAppTenant {
  id?: string;
  tenantId?: string;
  appId?: string;
  menuId?: string;
  permissionId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationPageItemVO extends PlatformApp {
  menuName?: string;
  menuIcon?: string;
}

export interface ApplicationOrgPageItemVO extends PlatformAppTenant {
  menuName?: string;
  menuIcon?: string;
}
