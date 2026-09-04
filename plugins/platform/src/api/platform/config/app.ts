import { request } from "@ingot/admin-core";
import type { RequestOptions } from "@ingot/admin-core";
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
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/config/apps";

/** 应用分页 */
export function AppPageAPI(
  page: Page,
  filter?: PlatformAppFilterDTO,
  options?: RequestOptions,
): Promise<R<Page<PlatformApp>>> {
  if (filter) {
    filterParams(filter);
  }
  return request.get<Page<PlatformApp>>(
    `${PATH}/page`,
    {
      ...page,
      ...filter,
    },
    options,
  );
}

/** @deprecated 使用 AppPageAPI */
export function GetAppPageAPI(
  page: Page,
  filter?: PlatformAppFilterDTO,
  options?: RequestOptions,
): Promise<R<Page<PlatformApp>>> {
  return AppPageAPI(page, filter, options);
}

/** 应用详情 */
export function AppDetailAPI(appId: string, options?: RequestOptions): Promise<R<PlatformAppDetailVO>> {
  return request.get<PlatformAppDetailVO>(`${PATH}/${appId}`, undefined, options);
}

/** 创建应用 */
export function CreateAppAPI(
  params: PlatformAppCreateDTO,
  options?: RequestOptions,
): Promise<R<string>> {
  filterParams(params);
  return request.post<string>(PATH, params, options);
}

/** 更新应用 */
export function UpdateAppAPI(
  appId: string,
  params: PlatformAppUpdateDTO,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${appId}`, params, options);
}

/** 更新应用状态 */
export function PatchAppStatusAPI(
  appId: string,
  status: CommonStatus | string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.patch<void>(`${PATH}/${appId}/status`, { status }, options);
}

/** 删除应用 */
export function RemoveAppAPI(
  appId: string,
  force: boolean = false,
  options?: RequestOptions,
): Promise<R<void>> {
  const params = force ? { force } : undefined;
  return request.delete<void>(`${PATH}/${appId}`, null, {
    params,
    ...options,
  });
}

/** 应用菜单树 */
export function AppMenuTreeAPI(appId: string, options?: RequestOptions): Promise<R<Array<MenuTreeNode>>> {
  return request.get<Array<MenuTreeNode>>(`${PATH}/${appId}/menus/tree`, undefined, options);
}

/** 创建应用菜单 */
export function CreateAppMenuAPI(
  appId: string,
  params: PlatformMenu,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}/${appId}/menus`, params, options);
}

/** 更新应用菜单 */
export function UpdateAppMenuAPI(
  appId: string,
  menuId: string,
  params: PlatformMenu,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${appId}/menus/${menuId}`, params, options);
}

/** 删除应用菜单 */
export function RemoveAppMenuAPI(
  appId: string,
  menuId: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${appId}/menus/${menuId}`, null, options);
}

/** 应用权限树 */
export function AppPermissionTreeAPI(
  appId: string,
  options?: RequestOptions,
): Promise<R<Array<AppPermissionTreeNodeVO>>> {
  return request.get<Array<AppPermissionTreeNodeVO>>(
    `${PATH}/${appId}/permissions/tree`,
    undefined,
    options,
  );
}

/** 创建应用权限 */
export function CreateAppPermissionAPI(
  appId: string,
  params: AppPermissionCreateDTO,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}/${appId}/permissions`, params, options);
}

/** 更新应用权限 */
export function UpdateAppPermissionAPI(
  appId: string,
  permissionId: string,
  params: AppPermissionUpdateDTO,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/${appId}/permissions/${permissionId}`, params, options);
}

/** 删除应用权限 */
export function RemoveAppPermissionAPI(
  appId: string,
  permissionId: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${appId}/permissions/${permissionId}`, null, options);
}
