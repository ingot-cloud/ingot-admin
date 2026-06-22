import type { CommonStatus } from "./enums";

export interface PlatformPermission {
  id?: string;
  appId?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  nodeType?: string;
  sourceType?: string;
  sourceId?: string;
  managed?: boolean;
  readOnly?: boolean;
  orgType?: string;
  remark?: string;
  createdAt?: string;
}

export interface PermissionTreeNode extends PlatformPermission {
  children?: Array<PermissionTreeNode>;
}

export interface AppPermissionTreeNodeVO extends PermissionTreeNode { }

export interface AppPermissionCreateDTO {
  pid?: string;
  name?: string;
  code?: string;
  nodeType?: string;
  remark?: string;
}

export interface AppPermissionUpdateDTO {
  name?: string;
  remark?: string;
  status?: CommonStatus;
}

export interface BizPermissionTreeNodeVO extends PermissionTreeNode {
  PlatformRoleBind?: boolean;
  defaultFlag?: boolean;
}

export interface PermissionFilterDTO extends PlatformPermission {
  orgTypeText?: string;
}

export interface MemberPermission {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  remark?: string;
  createdAt?: string;
}

export interface MemberPermissionTreeNodeVO extends MemberPermission {
  children?: Array<MemberPermissionTreeNodeVO>;
}
