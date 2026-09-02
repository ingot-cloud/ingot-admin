import type { CommonStatus } from "./enums";

export interface PlatformRole {
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

export interface RoleTreeNodeVO extends PlatformRole {
  children?: Array<RoleTreeNodeVO>;
  custom?: boolean;
  typeText?: string;
  orgTypeText?: string;
  scopeTypeText?: string;
  statusText?: string;
}
