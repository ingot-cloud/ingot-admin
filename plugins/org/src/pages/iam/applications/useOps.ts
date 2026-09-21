import { type EntitlementRecord, type IamListQuery, type ResourceDetail } from "@ingot/admin-common";
import { TenantApplicationPageQueryOptions } from "@/api/iam/directory.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<EntitlementRecord>, IamListQuery>({
    queryOptions: TenantApplicationPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
