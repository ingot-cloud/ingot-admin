import { type IamListQuery, type ResourceDetail, type MemberRecord, type GroupRecord } from "@ingot/admin-common";
import { PlatformGroupPageQueryOptions, PlatformMemberPageQueryOptions } from "@/api/iam/personnel.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const enabled = () => !unavailable.value;
  const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery>({
    queryOptions: PlatformMemberPageQueryOptions,
    enabled,
  });
  const groupPaging = useServerPaging<ResourceDetail<GroupRecord>, IamListQuery>({
    queryOptions: PlatformGroupPageQueryOptions,
    enabled,
  });
  const refreshData = (): void => {
    paging.search();
  };
  const refreshGroups = (): void => {
    groupPaging.search();
  };
  return { paging, groupPaging, refreshData, refreshGroups };
};
