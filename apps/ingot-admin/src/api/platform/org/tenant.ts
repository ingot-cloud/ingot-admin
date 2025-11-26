import Http from "@/net";
import type { SysTenant, MetaApp, CreateOrgDTO, AppEnabledDTO, Page, R } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/org/tenant";

/**
 * 列表
 */
export function TenantSearchAPI(name?: string): Promise<R<Array<SysTenant>>> {
  return Http.get<Array<SysTenant>>(`${PATH}/search`, {
    name,
  });
}

/**
 * 租户信息
 */
export function TenantInfoAPI(id?: string) {
  return Http.get<SysTenant>(`${PATH}/${id}`);
}

/**
 * 租户分页信息
 */
export function TenantPageAPI(page: Page, condition?: SysTenant): Promise<R<Page<SysTenant>>> {
  if (condition) {
    filterParams(condition);
  }
  return Http.get<Page<SysTenant>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

export function TenantCreateAPI(params: CreateOrgDTO): Promise<R<void>> {
  filterParams(params);
  return Http.post<void>(`${PATH}`, params);
}

export function TenantUpdateAPI(params: SysTenant): Promise<R<void>> {
  filterParams(params);
  return Http.put<void>(`${PATH}`, params);
}

export function TenantRemoveAPI(id: string): Promise<R<void>> {
  return Http.delete<void>(`${PATH}/${id}`);
}

export function TenantOrgApps(): Promise<R<Array<MetaApp>>> {
  return Http.get<Array<MetaApp>>(`${PATH}/apps`);
}

export function TenantOrgAppEnabled(params: AppEnabledDTO): Promise<R<void>> {
  filterParams(params);
  return Http.put<void>(`${PATH}/app/status`, params);
}
