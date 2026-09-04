import type { MemberUser, MemberUserDTO, PageChangeParams } from "@/models";
import { MemberUserPageQueryOptions } from "@/api/member/user.query";
import { useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const paging = useServerPaging<MemberUser, MemberUserDTO>({
    queryOptions: MemberUserPageQueryOptions,
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
