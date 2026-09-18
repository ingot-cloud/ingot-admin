import {
  IamAction,
  type IamListQuery,
  type ResourceDetail,
  type TenantRecord,
} from "@ingot/admin-common";
import { PlatformTenantPageQueryOptions } from "@/api/iam/tenants.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<TenantRecord>, IamListQuery>({
    queryOptions: PlatformTenantPageQueryOptions,
    enabled: () => !unavailable.value,
  });

  const refreshData = (): void => {
    paging.search();
  };

  return {
    paging,
    refreshData,
    canRead: IamAction.PLATFORM_TENANT_READ,
  };
};
