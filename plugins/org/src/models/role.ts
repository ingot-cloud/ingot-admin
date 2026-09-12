import type { CommonStatus } from "./enums";

export interface RolePageItemVO {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  code: string;
  type: string;
  filterDept?: boolean;
  status: CommonStatus;
  createdAt: string;
}

export interface TenantRolePrivate {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  type?: string;
  filterDept?: boolean;
  status?: CommonStatus;
}

export interface RoleTreeNodeVO extends TenantRolePrivate {
  children?: Array<RoleTreeNodeVO>;
  custom?: boolean;
  isGroup?: boolean;
  typeText?: string;
  orgTypeText?: string;
  statusText?: string;
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
