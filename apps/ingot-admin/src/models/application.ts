export interface ApplicationFilterDTO {
  appName?: string;
}

export interface MetaApp {
  id?: string;
  menuId?: string;
  authorityId?: string;
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

export interface MetaAppTenant {
  id?: string;
  tenantId?: string;
  appId?: string;
  menuId?: string;
  authorityId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationPageItemVO extends MetaApp {
  menuName?: string;
  menuIcon?: string;
}

export interface ApplicationOrgPageItemVO extends MetaAppTenant {
  menuName?: string;
  menuIcon?: string;
}
