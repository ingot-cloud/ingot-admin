import type { CommonStatus } from "./enums";
import type { SimpleUserVO } from "./user";

export interface TenantDept {
  id?: string;
  pid?: string;
  name?: string;
  sort?: number;
  mainFlag?: boolean;
  status?: CommonStatus;
}

/**
 * 部门树节点
 */
export interface DeptTreeNode {
  // 部门名称
  name?: string;
  sort?: number;
  mainFlag?: boolean;
  status?: CommonStatus;
  id?: string;
  pid?: string;
  children?: Array<DeptTreeNode>;
}

export interface DeptTreeNodeWithManagerVO extends DeptTreeNode {
  managerUsers?: Array<SimpleUserVO>;
  memberCount?: string;
}

export interface DeptWithManagerDTO extends TenantDept {
  managerUserIds?: Array<string>;
}

export const RootDept: DeptTreeNode = {
  id: "0",
  name: "根部门",
};
