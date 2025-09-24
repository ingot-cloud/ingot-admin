import type { CommonStatus } from "./enums";
import type { SimpleUserVO } from "./user";

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
  managerUsers?: Array<SimpleUserVO>;
  memberCount?: string;
}

/**
 * 部门模型
 */
export interface SysDept {
  id?: string;
  pid?: string;
  name?: string;
  sort?: number;
  status?: CommonStatus;
}

export interface DeptWithManagerVO extends SysDept {
  managerUsers?: Array<SimpleUserVO>;
}

export interface DeptWithManagerDTO extends SysDept {
  managerUserIds?: Array<string>;
}

export const RootDept: DeptTreeNode = {
  id: "0",
  name: "根部门",
};
