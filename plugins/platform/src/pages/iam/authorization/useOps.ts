import type { AssignmentRecord, DelegationRecord, IamListQuery, ResourceDetail, RoleSummary } from "@ingot/admin-common";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";
import {
  PlatformAssignmentPageQueryOptions,
  PlatformDelegationPageQueryOptions,
  PlatformRolePageQueryOptions,
} from "@/api/iam/authorization.query";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const enabled = () => !unavailable.value;
  const roles = useServerPaging<ResourceDetail<RoleSummary>, IamListQuery>({
    queryOptions: PlatformRolePageQueryOptions,
    enabled,
  });
  const assignments = useServerPaging<ResourceDetail<AssignmentRecord>, IamListQuery>({
    queryOptions: PlatformAssignmentPageQueryOptions,
    enabled,
  });
  const delegations = useServerPaging<ResourceDetail<DelegationRecord>, IamListQuery>({
    queryOptions: PlatformDelegationPageQueryOptions,
    enabled,
  });
  const refreshRoles = (): void => {
    roles.search();
  };
  const refreshAssignments = (): void => {
    assignments.search();
  };
  const refreshDelegations = (): void => {
    delegations.search();
  };
  return { roles, assignments, delegations, refreshRoles, refreshAssignments, refreshDelegations };
};
