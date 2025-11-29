import request from "@/net";
import type { PermissionTreeNode } from "@/models";

export function OrgAuthTreeAPI() {
  return request.get<Array<PermissionTreeNode>>("/api/pms/v1/org/auth/tree");
}
