export interface ApplicationFilterDTO {
  appName?: string;
}

export interface SysApplication {
  id?: string;
  menuId?: string;
  authorityId?: string;
  defaultApp?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SysApplicationTenant {
  id?: string;
  tenantId?: string;
  appId?: string;
  menuId?: string;
  authorityId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationPageItemVO extends SysApplication {
  menuName?: string;
  menuIcon?: string;
}

export interface ApplicationOrgPageItemVO extends SysApplicationTenant {
  menuName?: string;
  menuIcon?: string;
}
