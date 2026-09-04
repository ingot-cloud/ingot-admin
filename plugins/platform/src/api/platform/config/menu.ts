import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, MenuTreeNode, PlatformMenu } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/config/menu";

/**
 * 获取全量菜单树（只读）
 */
export function GetMenuTreeAPI(
  filter?: PlatformMenu,
  options?: RequestOptions,
): Promise<R<Array<MenuTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<MenuTreeNode>>(`${PATH}/tree`, filter, options);
}
