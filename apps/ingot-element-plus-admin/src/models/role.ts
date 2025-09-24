import type { CommonStatus } from "./enums";

export interface RolePageItemVO {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  code: string;
  type: string;
  filterDept?: boolean;
  scopeType?: string;
  scopes?: Array<string>;
  status: CommonStatus;
  createdAt: string;
}

export interface RoleTreeNode {
  id?: string;
  name?: string;
  isGroup?: boolean;
  children?: Array<RoleTreeNode>;
}

export interface SysRole {
  id?: string;
  groupId?: string;
  name?: string;
  code?: string;
  type?: string;
  filterDept?: boolean;
  scopeType?: string;
  scopes?: Array<string>;
  status?: CommonStatus;
}

export interface RoleBindParams {
  id?: string;
  removeIds?: Array<string>;
  bindIds?: Array<string>;
}

export interface RoleGroupItemVO {
  id?: string;
  name?: string;
  code?: string;
  status?: string;
  isGroup?: boolean;
  groupId?: string;
  type?: string;
  filterDept?: boolean;
  scopeType?: string;
  scopes?: Array<string>;
  children?: Array<RoleGroupItemVO>;
}

export interface SysRoleGroup {
  id?: string;
  name?: string;
  sort?: string;
  type?: string;
}

export interface RoleFilterDTO {
  roleName?: string;
  roleType?: string;
}

export interface AppRole extends SysRole {}
export interface AppRoleGroup extends SysRoleGroup {}
