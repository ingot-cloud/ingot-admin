import type { CommonStatus } from "./enums";

export interface PlatformPermission {
  id?: string;
  appId?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  nodeType?: string;
  orgType?: string;
  resourceId?: string;
  remark?: string;
  createdAt?: string;
}

export interface PermissionTreeNode extends PlatformPermission {
  children?: Array<PermissionTreeNode>;
}

export interface AppPermissionTreeNodeVO extends PermissionTreeNode {}

export interface AppPermissionCreateDTO {
  pid?: string;
  name?: string;
  code?: string;
  nodeType?: string;
  resourceId?: string;
  status?: CommonStatus;
  remark?: string;
}

export interface AppPermissionUpdateDTO {
  name?: string;
  remark?: string;
  status?: CommonStatus;
}

export interface PermissionFilterDTO extends PlatformPermission {
  orgTypeText?: string;
}
