import { type IamListQuery, type ResourceDetail, type PlanRecord } from "@ingot/admin-common";
import { PlatformPlanPageQueryOptions } from "@/api/iam/catalog.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<PlanRecord>, IamListQuery>({
    queryOptions: PlatformPlanPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
