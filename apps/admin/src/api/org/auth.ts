import { Http as request } from "@ingot/admin-core";
import type { PermissionTreeNode } from "@base/models";

export function OrgAuthTreeAPI() {
  return request.get<Array<PermissionTreeNode>>("/api/pms/v1/org/auth/tree");
}
