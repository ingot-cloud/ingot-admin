import request from "@/net";
import type { R, MenuTreeNode, PlatformMenu } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/base/menu";

/**
 * 获取Menu tree
 * @returns
 */
export function GetMenuTreeAPI(filter?: PlatformMenu): Promise<R<Array<MenuTreeNode>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Array<MenuTreeNode>>(`${PATH}/tree`, filter);
}

/**
 * 创建菜单
 * @param params 参数
 * @returns
 */
export function CreateMenuAPI(params: PlatformMenu): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

/**
 * 更新菜单
 * @param params 参数
 * @returns
 */
export function UpdateMenuAPI(params: PlatformMenu): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

/**
 * 删除菜单
 * @param id id
 * @returns
 */
export function RemoveMenuAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
