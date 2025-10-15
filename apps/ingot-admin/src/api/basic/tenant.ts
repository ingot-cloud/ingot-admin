import Http from "@/net";
import type { SysTenant, CreateOrgDTO, Page, R } from "@/models";
import { filterParams } from "@/utils/object";

/**
 * 列表
 */
export function TenantSearchAPI(name?: string): Promise<R<Array<SysTenant>>> {
  return Http.get<Array<SysTenant>>("/api/pms/v1/admin/tenant/search", {
    name,
  });
}

/**
 * 租户信息
 */
export function TenantInfoAPI(id?: string) {
  return Http.get<SysTenant>(`/api/pms/v1/admin/tenant/${id}`);
}

/**
 * 租户分页信息
 */
export function TenantPageAPI(page: Page, condition?: SysTenant): Promise<R<Page<SysTenant>>> {
  if (condition) {
    filterParams(condition);
  }
  return Http.get<Page<SysTenant>>("/api/pms/v1/admin/tenant/page", {
    ...page,
    ...condition,
  });
}

export function TenantCreateAPI(params: CreateOrgDTO): Promise<R<void>> {
  filterParams(params);
  return Http.post<void>("/api/pms/v1/admin/tenant", params);
}

export function TenantUpdateAPI(params: SysTenant): Promise<R<void>> {
  filterParams(params);
  return Http.put<void>("/api/pms/v1/admin/tenant", params);
}

export function TenantRemoveAPI(id: string): Promise<R<void>> {
  return Http.delete<void>(`/api/pms/v1/admin/tenant/${id}`);
}
