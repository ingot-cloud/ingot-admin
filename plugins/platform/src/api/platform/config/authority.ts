import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, PlatformPermission, PermissionTreeNode } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/config/permission";

/**
 * 获取全量权限树（只读）
 */
export function GetAuthorityTreeAPI(
  filter?: PlatformPermission,
  options?: RequestOptions,
): Promise<R<Array<PermissionTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<PermissionTreeNode>>(`${PATH}/tree`, filter, options);
}
