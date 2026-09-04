import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  createResourceQueryKeys,
  queryAdminData,
  REFERENCE_QUERY_STALE_TIME,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { PlatformApp, SysTenant } from "@/models";
import { TenantInfoAPI, TenantOrgAppsAPI, TenantPageAPI, TenantSearchAPI } from "./tenant";

const resourceKeys = createResourceQueryKeys("platform", "tenant");

export const tenantQueryKeys = {
  ...resourceKeys,
  searches: () => [...resourceKeys.all, "search"] as const,
  search: (name: string) => [...resourceKeys.all, "search", name] as const,
  apps: (id: string) => [...resourceKeys.detail(id), "apps"] as const,
};

export const TenantPageQueryOptions = createPageQueryOptions<SysTenant, SysTenant>(
  tenantQueryKeys,
  TenantPageAPI,
);

export function TenantDetailQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: tenantQueryKeys.detail(value),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<SysTenant> =>
      TenantInfoAPI(value, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export function TenantSearchQueryOptions(name: MaybeRefOrGetter<string>) {
  const value = toValue(name);
  return queryOptions({
    queryKey: tenantQueryKeys.search(value),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<SysTenant>> =>
      TenantSearchAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function TenantOrgAppsQueryOptions(tenantId: MaybeRefOrGetter<string>) {
  const value = toValue(tenantId);
  return queryOptions({
    queryKey: tenantQueryKeys.apps(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<PlatformApp>> =>
      TenantOrgAppsAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export const searchTenants = (name: string): Promise<Array<SysTenant>> =>
  queryAdminData(TenantSearchQueryOptions(name));

export const fetchTenantInfo = (id: string): Promise<SysTenant> =>
  queryAdminData(TenantDetailQueryOptions(id));

export const fetchTenantOrgApps = (tenantId: string): Promise<Array<PlatformApp>> =>
  queryAdminData(TenantOrgAppsQueryOptions(tenantId));
