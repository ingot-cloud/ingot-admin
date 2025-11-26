import type { CommonStatus } from "./enums";

export interface MetaAuthority {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  status?: CommonStatus;
  type?: string;
  orgType?: string;
  remark?: string;
  createdAt?: string;
}

export interface AuthorityTreeNode extends MetaAuthority {
  children?: Array<AuthorityTreeNode>;
}

export interface BizAuthorityTreeNodeVO extends AuthorityTreeNode {
  metaRoleBind?: boolean;
}

export interface AuthorityFilterDTO extends MetaAuthority {
  orgTypeText?: string;
}
