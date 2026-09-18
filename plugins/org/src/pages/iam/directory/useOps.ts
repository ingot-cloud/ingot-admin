import { type IamListQuery, type ResourceDetail, type MemberRecord } from "@ingot/admin-common";
import { DirectoryMemberPageQueryOptions } from "@/api/iam/directory.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery>({
    queryOptions: DirectoryMemberPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
