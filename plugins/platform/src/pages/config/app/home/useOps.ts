import type { PageChangeParams, PlatformApp, PlatformAppFilterDTO } from "@/models";
import { AppPageAPI } from "@/api/platform/config/app";
import { AppTypeEnum } from "@/models/enums";

export const useOps = () => {
  const paging = usePaging<PlatformApp, PlatformAppFilterDTO>(transformPageAPI(AppPageAPI));

  const resetFilter = (): void => {
    paging.condition.status = undefined;
    paging.condition.name = undefined;
    fetchData();
  };

  const fetchData = (params?: PageChangeParams): void => {
    paging.exec(params);
  };

  return {
    loading: paging.loading,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchData,
  };
};
