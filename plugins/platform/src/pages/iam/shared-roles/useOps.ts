import { type IamListQuery, type ResourceDetail, type RoleSummary } from "@ingot/admin-common";
import { PlatformSharedRolePageQueryOptions } from "@/api/iam/authorization.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<RoleSummary>, IamListQuery>({
    queryOptions: PlatformSharedRolePageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
