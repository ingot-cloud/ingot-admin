import { queryOptions } from "@tanstack/vue-query";
import {
  createResourceQueryKeys,
  queryAdminData,
  REFERENCE_QUERY_STALE_TIME,
  silentQueryRequest,
  snapshotQueryParams,
  type LoadDataParams,
  type Page,
} from "@ingot/admin-core";
import type { TenantOption, TenantOptionQuery } from "../models/tenant";
import { TenantOptionPageAPI } from "./tenant";

export const tenantOptionQueryKeys = createResourceQueryKeys("common", "tenant-option");

export function TenantOptionPageQueryOptions(input: {
  page: Page;
  condition?: TenantOptionQuery;
}) {
  return queryOptions({
    queryKey: tenantOptionQueryKeys.list(snapshotQueryParams(input)),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    queryFn: ({ signal }): Promise<Page<TenantOption>> =>
      TenantOptionPageAPI(input.page, { ...input.condition }, silentQueryRequest(signal)).then(
        ({ data }) => data,
      ),
  });
}

export const loadTenantOptions = async (params: LoadDataParams): Promise<Page<TenantOption>> => {
  return queryAdminData(
    TenantOptionPageQueryOptions({
      page: {
        current: params.current,
        size: params.size,
      },
      condition: {
        name: params.query,
      },
    }),
  );
};
