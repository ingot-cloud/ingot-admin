import { Http as request } from "@ingot/admin-core";
import type { R, MenuTreeNode, PlatformMenu } from "@base/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/config/menu";

/**
 * 获取全量菜单树（只读）
 * @returns
 */
export function GetMenuTreeAPI(filter?: PlatformMenu): Promise<R<Array<MenuTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<MenuTreeNode>>(`${PATH}/tree`, filter);
}
