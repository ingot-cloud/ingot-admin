import { type AccountListQuery, type AccountRecord, type ResourceDetail } from "@ingot/admin-common";
import { PlatformAccountPageQueryOptions } from "@/api/iam/accounts.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<AccountRecord>, AccountListQuery>({
    queryOptions: PlatformAccountPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
