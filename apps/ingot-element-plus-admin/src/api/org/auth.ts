import request from "@/net";
import type { R, RoleBindParams, SysAuthority, AuthorityTreeNode } from "@/models";
import { filterParams } from "@/utils/object";

export function OrgAuthList() {
  return request.get<Array<AuthorityTreeNode>>("/api/pms/v1/org/auth/list");
}

export function BindAuthorityAPI(params: RoleBindParams): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/org/auth/bindAuthority", params);
}

export function GetBindAuthoritiesAPI(
  id: string,
  condition?: SysAuthority,
): Promise<R<Array<AuthorityTreeNode>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Array<AuthorityTreeNode>>(`/api/pms/v1/org/auth/bindAuthority/${id}`, {
    ...condition,
  });
}
