import type { CommonStatus } from "./enums";

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

export interface PermissionTreeNode {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  children?: Array<PermissionTreeNode>;
}
