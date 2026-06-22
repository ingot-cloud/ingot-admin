import request from "@/net";
import type {
  R,
  Page,
  PlatformApp,
  PlatformAppDetailVO,
  PlatformAppFilterDTO,
  PlatformAppCreateDTO,
  PlatformAppUpdateDTO,
  MenuTreeNode,
  PlatformMenu,
  AppPermissionTreeNodeVO,
  AppPermissionCreateDTO,
  AppPermissionUpdateDTO,
} from "@/models";
import type { CommonStatus } from "@/models/enums";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/config/apps";

/** 应用分页 */
export function AppPageAPI(
  page: Page,
  filter?: PlatformAppFilterDTO,
): Promise<R<Page<PlatformApp>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Page<PlatformApp>>(`${PATH}/page`, {
    ...page,
    ...filter,
  });
}

/** @deprecated 使用 AppPageAPI */
export function GetAppPageAPI(
  page: Page,
  filter?: PlatformAppFilterDTO,
): Promise<R<Page<PlatformApp>>> {
  return AppPageAPI(page, filter);
}

/** 应用详情 */
export function AppDetailAPI(appId: string): Promise<R<PlatformAppDetailVO>> {
  return request.get<PlatformAppDetailVO>(`${PATH}/${appId}`);
}

/** 创建应用 */
export function CreateAppAPI(params: PlatformAppCreateDTO): Promise<R<string>> {
  filterParams(params);
  return request.post<string>(PATH, params);
}

/** 更新应用 */
export function UpdateAppAPI(appId: string, params: PlatformAppUpdateDTO): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${appId}`, params);
}

/** 更新应用状态 */
export function PatchAppStatusAPI(appId: string, status: CommonStatus | string): Promise<R<void>> {
  return request.patch<void>(`${PATH}/${appId}/status`, { status });
}

/** 删除应用 */
export function RemoveAppAPI(appId: string, force: boolean = false): Promise<R<void>> {
  const params = force ? { force } : undefined;
  return request.delete<void>(`${PATH}/${appId}`, null, {
    params
  });
}

/** 应用菜单树 */
export function AppMenuTreeAPI(appId: string): Promise<R<Array<MenuTreeNode>>> {
  return request.get<Array<MenuTreeNode>>(`${PATH}/${appId}/menus/tree`);
}

/** 创建应用菜单 */
export function CreateAppMenuAPI(appId: string, params: PlatformMenu): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}/${appId}/menus`, params);
}

/** 更新应用菜单 */
export function UpdateAppMenuAPI(
  appId: string,
  menuId: string,
  params: PlatformMenu,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${appId}/menus/${menuId}`, params);
}

/** 删除应用菜单 */
export function RemoveAppMenuAPI(appId: string, menuId: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${appId}/menus/${menuId}`);
}

/** 应用权限树 */
export function AppPermissionTreeAPI(appId: string): Promise<R<Array<AppPermissionTreeNodeVO>>> {
  return request.get<Array<AppPermissionTreeNodeVO>>(`${PATH}/${appId}/permissions/tree`);
}

/** 创建应用权限 */
export function CreateAppPermissionAPI(
  appId: string,
  params: AppPermissionCreateDTO,
): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}/${appId}/permissions`, params);
}

/** 更新应用权限 */
export function UpdateAppPermissionAPI(
  appId: string,
  permissionId: string,
  params: AppPermissionUpdateDTO,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${appId}/permissions/${permissionId}`, params);
}

/** 删除应用权限 */
export function RemoveAppPermissionAPI(appId: string, permissionId: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${appId}/permissions/${permissionId}`);
}
