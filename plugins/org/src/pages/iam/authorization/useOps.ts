import type { AssignmentRecord, DelegationRecord, IamListQuery, ResourceDetail, RoleSummary } from "@ingot/admin-common";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";
import type { MaybeRefOrGetter } from "vue";
import {
  TenantAssignmentPageQueryOptions,
  TenantDelegationPageQueryOptions,
  TenantRolePageQueryOptions,
} from "@/api/iam/authorization.query";

export const useOps = (tab: MaybeRefOrGetter<string>) => {
  const { unavailable } = useCapabilities();
  const tabEnabled = (name: string) => () => !unavailable.value && toValue(tab) === name;
  const roles = useServerPaging<ResourceDetail<RoleSummary>, IamListQuery>({
    queryOptions: TenantRolePageQueryOptions,
    enabled: tabEnabled("roles"),
  });
  const assignments = useServerPaging<ResourceDetail<AssignmentRecord>, IamListQuery>({
    queryOptions: TenantAssignmentPageQueryOptions,
    enabled: tabEnabled("assignments"),
  });
  const delegations = useServerPaging<ResourceDetail<DelegationRecord>, IamListQuery>({
    queryOptions: TenantDelegationPageQueryOptions,
    enabled: tabEnabled("delegations"),
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
