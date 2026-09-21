import type { AssignmentRecord, DelegationRecord, IamListQuery, ResourceDetail, RoleSummary } from "@ingot/admin-common";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";
import {
  TenantAssignmentPageQueryOptions,
  TenantDelegationPageQueryOptions,
  TenantRolePageQueryOptions,
} from "@/api/iam/authorization.query";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const enabled = () => !unavailable.value;
  const roles = useServerPaging<ResourceDetail<RoleSummary>, IamListQuery>({
    queryOptions: TenantRolePageQueryOptions,
    enabled,
  });
  const assignments = useServerPaging<ResourceDetail<AssignmentRecord>, IamListQuery>({
    queryOptions: TenantAssignmentPageQueryOptions,
    enabled,
  });
  const delegations = useServerPaging<ResourceDetail<DelegationRecord>, IamListQuery>({
    queryOptions: TenantDelegationPageQueryOptions,
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
