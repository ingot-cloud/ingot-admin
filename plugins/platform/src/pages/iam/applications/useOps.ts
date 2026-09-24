import {
  AuthorizationDomain,
  type IamListQuery,
  type ResourceDetail,
  type ApplicationRecord,
} from "@ingot/admin-common";
import { PlatformApplicationPageQueryOptions } from "@/api/iam/catalog.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<ApplicationRecord>, IamListQuery>({
    queryOptions: PlatformApplicationPageQueryOptions,
    initialCondition: { domain: AuthorizationDomain.PLATFORM },
    enabled: () => !unavailable.value,
    queryWhen: (submitted) => Boolean(submitted.domain),
  });
  const refreshData = (): void => {
    paging.search();
  };
  return { paging, refreshData };
};
