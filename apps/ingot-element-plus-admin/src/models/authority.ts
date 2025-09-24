import type { CommonStatus } from "./enums";

export interface AuthorityTreeNode extends SysAuthority {
  children?: Array<AuthorityTreeNode>;
}

export interface SysAuthority {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  remark?: string;
  createdAt?: string;
}

export interface AuthorityFilterDTO extends SysAuthority {
  orgTypeText?: string;
}
