import type { AllOrgUserFilterDTO, PageChangeParams, SysUser } from "@/models";
import { PlatformAdminUserPageQueryOptions } from "@/api/platform/admin/user.query";
import { useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const paging = useServerPaging<SysUser, AllOrgUserFilterDTO>({
    queryOptions: PlatformAdminUserPageQueryOptions,
  });

  const resetFilter = (): void => {
    paging.resetSubmitted({
      phone: undefined,
      email: undefined,
      nickname: undefined,
    });
  };

  const fetchUserData = (params?: PageChangeParams): void => {
    paging.fetchData(params);
  };

  return {
    loading: paging.fetching,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchUserData,
  };
};
