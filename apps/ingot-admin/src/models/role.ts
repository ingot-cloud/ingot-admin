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

export interface MetaRole {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  type?: string;
  orgType?: string;
  filterDept?: boolean;
  scopeType?: string;
  scopes?: Array<string>;
  status?: CommonStatus;
}

export interface RoleTreeNodeVO extends MetaRole {
  children?: Array<RoleTreeNodeVO>;
  custom?: boolean;
  typeText?: string;
  orgTypeText?: string;
  scopeTypeText?: string;
  statusText?: string;
}

export interface TenantRolePrivate {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  type?: string;
  filterDept?: boolean;
  scopeType?: string;
  scopes?: Array<string>;
  status?: CommonStatus;
}

export interface BizRoleAssignUsersDTO {
  deptId?: string;
  id?: string;
  assignIds?: Array<string>;
  unassignIds?: Array<string>;
}

export interface RoleFilterDTO {
  roleName?: string;
  roleType?: string;
}

export interface AppRole extends MetaRole {}
export interface AppRoleGroup {}
