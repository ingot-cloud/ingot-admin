import request from "@/net";
import type { AuthorityTreeNode } from "@/models";

export function OrgAuthTreeAPI() {
  return request.get<Array<AuthorityTreeNode>>("/api/pms/v1/org/auth/tree");
}
