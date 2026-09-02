import { request } from "@ingot/admin-core";
import type { SysTenant, PlatformApp, CreateOrgDTO, AppEnabledDTO, Page, R } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/org/tenant";

/**
 * 列表
 */
export function TenantSearchAPI(name?: string): Promise<R<Array<SysTenant>>> {
  return request.get<Array<SysTenant>>(`${PATH}/search`, {
    name,
  });
}

/**
 * 租户信息
 */
export function TenantInfoAPI(id?: string): Promise<R<SysTenant>> {
  return request.get<SysTenant>(`${PATH}/${id}`);
}

/**
 * 租户分页信息
 */
export function TenantPageAPI(page: Page, condition?: SysTenant): Promise<R<Page<SysTenant>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysTenant>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

export function TenantCreateAPI(params: CreateOrgDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

export function TenantUpdateAPI(params: SysTenant): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

export function TenantRemoveAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}

export function TenantOrgAppsAPI(tenantId: string): Promise<R<Array<PlatformApp>>> {
  return request.get<Array<PlatformApp>>(`${PATH}/apps`, null, {
    headers: {
      Tenant: tenantId,
    }
  });
}

export function TenantOrgAppEnabledAPI(tenantId: string, params: AppEnabledDTO): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/app/status`, params, {
    headers: {
      Tenant: tenantId,
    }
  });
}
