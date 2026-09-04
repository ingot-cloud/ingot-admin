import { request, type RequestOptions } from "@ingot/admin-core";
import type { SysTenant, PlatformApp, CreateOrgDTO, AppEnabledDTO, Page, R } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/org/tenant";

export function TenantSearchAPI(name?: string, options?: RequestOptions): Promise<R<Array<SysTenant>>> {
  return request.get<Array<SysTenant>>(
    `${PATH}/search`,
    {
      name,
    },
    options,
  );
}

export function TenantInfoAPI(id?: string, options?: RequestOptions): Promise<R<SysTenant>> {
  return request.get<SysTenant>(`${PATH}/${id}`, undefined, options);
}

export function TenantPageAPI(
  page: Page,
  condition?: SysTenant,
  options?: RequestOptions,
): Promise<R<Page<SysTenant>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysTenant>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

export function TenantCreateAPI(params: CreateOrgDTO, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params, options);
}

export function TenantUpdateAPI(params: SysTenant, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function TenantRemoveAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}

export function TenantOrgAppsAPI(
  tenantId: string,
  options?: RequestOptions,
): Promise<R<Array<PlatformApp>>> {
  return request.get<Array<PlatformApp>>(`${PATH}/apps`, null, {
    ...options,
    headers: {
      Tenant: tenantId,
    },
  });
}

export function TenantOrgAppEnabledAPI(
  tenantId: string,
  params: AppEnabledDTO,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}/app/status`, params, {
    ...options,
    headers: {
      Tenant: tenantId,
    },
  });
}
