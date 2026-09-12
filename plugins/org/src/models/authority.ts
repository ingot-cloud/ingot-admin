import type { CommonStatus } from "./enums";

export interface PermissionTreeNode {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  nodeType?: string;
  resourceId?: string;
  children?: Array<PermissionTreeNode>;
}

export interface BizPermissionTreeNodeVO extends PermissionTreeNode {
  platformRoleBind?: boolean;
  defaultFlag?: boolean;
}
