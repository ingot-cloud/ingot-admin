import type { CommonStatus } from "./enums";

export interface PlatformPermission {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  orgType?: string;
  remark?: string;
  createdAt?: string;
}

export interface PermissionTreeNode extends PlatformPermission {
  children?: Array<PermissionTreeNode>;
}

export interface BizPermissionTreeNodeVO extends PermissionTreeNode {
  PlatformRoleBind?: boolean;
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
