import type { CommonStatus } from "./enums";

export interface MemberRole {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  builtIn?: boolean;
  status?: CommonStatus;
}

export interface MemberRoleTreeNodeVO extends MemberRole {
  children?: Array<MemberRoleTreeNodeVO>;
}
