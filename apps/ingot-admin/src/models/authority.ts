import type { CommonStatus } from "./enums";

export interface MetaPermission {
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

export interface PermissionTreeNode extends MetaPermission {
  children?: Array<PermissionTreeNode>;
}

export interface BizPermissionTreeNodeVO extends PermissionTreeNode {
  metaRoleBind?: boolean;
}

export interface PermissionFilterDTO extends MetaPermission {
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
