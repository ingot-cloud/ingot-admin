import type { PageChangeParams, PlatformApp, PlatformAppFilterDTO } from "@/models";
import { AppPageQueryOptions } from "@/api/platform/config/app.query";
import { useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const paging = useServerPaging<PlatformApp, PlatformAppFilterDTO>({
    queryOptions: AppPageQueryOptions,
  });

  const resetFilter = (): void => {
    paging.resetSubmitted({
      appType: undefined,
      status: undefined,
      name: undefined,
    });
  };

  const fetchData = (params?: PageChangeParams): void => {
    paging.fetchData(params);
  };

  return {
    loading: paging.fetching,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchData,
  };
};
