import type { CommonStatus } from "./enums";

export interface PermissionTreeNode {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  children?: Array<PermissionTreeNode>;
}

export interface BizPermissionTreeNodeVO extends PermissionTreeNode {
  PlatformRoleBind?: boolean;
  defaultFlag?: boolean;
}
