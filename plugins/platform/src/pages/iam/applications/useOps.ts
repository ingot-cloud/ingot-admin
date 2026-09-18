import { type IamListQuery, type ResourceDetail, type ApplicationRecord } from "@ingot/admin-common";
import { PlatformApplicationPageQueryOptions } from "@/api/iam/catalog.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<ApplicationRecord>, IamListQuery>({
    queryOptions: PlatformApplicationPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
