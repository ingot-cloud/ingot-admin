import type { PageChangeParams, PlatformApp, PlatformAppFilterDTO } from "@/models";
import { AppPageQueryOptions } from "@/api/platform/config/app.query";
import { useServerPaging } from "@ingot/admin-core";
import { resolveAppPickerFilter, toAppPickerValue } from "./table";

export const useOps = () => {
  const paging = useServerPaging<PlatformApp, PlatformAppFilterDTO>({
    queryOptions: AppPageQueryOptions,
  });

  const fetchData = (params?: PageChangeParams): void => {
    paging.fetchData(params);
  };

  const appTypeFilter = computed({
    get: (): string => toAppPickerValue(paging.condition.appType),
    set: (value: string | number | boolean | null) => {
      paging.condition.appType = resolveAppPickerFilter(value);
      fetchData();
    },
  });

  const statusFilter = computed({
    get: (): string => toAppPickerValue(paging.condition.status),
    set: (value: string | number | boolean | null) => {
      paging.condition.status = resolveAppPickerFilter(value);
      fetchData();
    },
  });

  const nameFilter = computed({
    get: (): string => paging.condition.name ?? "",
    set: (value: string) => {
      paging.condition.name = value ? value : undefined;
    },
  });

  const searchByName = (): void => {
    const next = paging.condition.name?.trim();
    paging.condition.name = next ? next : undefined;
    fetchData();
  };

  return {
    loading: paging.fetching,
    appTypeFilter,
    statusFilter,
    nameFilter,
    pageInfo: paging.pageInfo,
    fetchData,
    searchByName,
  };
};
