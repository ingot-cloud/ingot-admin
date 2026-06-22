import request from "@/net";
import type { R, MenuTreeNode, PlatformMenu } from "@/models";
import { filterParams } from "@/utils/object";

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
