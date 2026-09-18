import { type IamListQuery, type ResourceDetail, type GroupRecord } from "@ingot/admin-common";
import { TenantGroupPageQueryOptions } from "@/api/iam/directory.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<GroupRecord>, IamListQuery>({
    queryOptions: TenantGroupPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
