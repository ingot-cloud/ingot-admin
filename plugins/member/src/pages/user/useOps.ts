import type { MemberUser, MemberUserDTO, PageChangeParams } from "@/models";
import { MemberUserPageQueryOptions } from "@/api/member/user.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";
import { MemberAction } from "@/models/actions";

export const useOps = () => {
  const { hasAction } = useCapabilities();
  const paging = useServerPaging<MemberUser, MemberUserDTO>({
    queryOptions: MemberUserPageQueryOptions,
    enabled: () => hasAction(MemberAction.USER_QUERY),
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
    failed: paging.query.isError,
    submitted: paging.submitted,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchUserData,
  };
};
