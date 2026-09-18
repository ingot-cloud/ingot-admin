import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createIamPageQueryOptions,
  type ResourceDetail,
  type TenantRecord,
} from "@ingot/admin-common";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import { PlatformTenantDetailAPI, PlatformTenantPageAPI } from "./tenants";

export const platformTenantQueryKeys = createResourceQueryKeys("iam-platform", "tenant");

export const PlatformTenantPageQueryOptions = createIamPageQueryOptions(
  platformTenantQueryKeys,
  PlatformTenantPageAPI,
);

export function PlatformTenantDetailQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: platformTenantQueryKeys.detail(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<ResourceDetail<TenantRecord>> =>
      PlatformTenantDetailAPI(value, silentQueryRequest(signal)).then(({ data }) => data),
  });
}
