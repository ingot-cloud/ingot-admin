import { request, type RequestOptions } from "@ingot/admin-core";
import type { PermissionTreeNode, R } from "@/models";

export function OrgAuthTreeAPI(
  options?: RequestOptions,
): Promise<R<Array<PermissionTreeNode>>> {
  return request.get<Array<PermissionTreeNode>>("/api/pms/v1/org/auth/tree", undefined, options);
}
