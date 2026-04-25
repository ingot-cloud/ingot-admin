export interface ApplicationFilterDTO {
  appName?: string;
}

export interface PlatformApp {
  id?: string;
  menuId?: string;
  permissionId?: string;
  name?: string;
  icon?: string;
  intro?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
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
