import { type IamListQuery, type ResourceDetail, type MemberRecord } from "@ingot/admin-common";
import { PlatformMemberPageQueryOptions } from "@/api/iam/personnel.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const enabled = () => !unavailable.value;
  const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery>({
    queryOptions: PlatformMemberPageQueryOptions,
    enabled,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
